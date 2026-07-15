import { Queue, Worker } from "bullmq";
import connection from "../../../config/redis.js";
import GeneratedBacklog from "../../../models/GeneratedBacklog.js";
import { getJiraClient } from "./jiraClient.js";
import { pushAISuggestionsHierarchy } from "./transformers/hierarchy.service.js";

// ── Queue (producer side) ──
export const pushQueue = new Queue("jira-push", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

// ── Worker (consumer side) ──
export const pushWorker = new Worker(
  "jira-push",
  async (job) => {
    const { backlogId, user, epicId } = job.data;

    console.log(`[Push Worker] Starting push for backlog ${backlogId}${epicId ? ` epic ${epicId}` : " (all)"}`);

    const backlog = await GeneratedBacklog.findById(backlogId);
    if (!backlog) throw new Error("Backlog not found");

    const client = await getJiraClient(user);

    // Filter what to push
    let epicsToPush = backlog.orchestrator_contract.epics;
    if (epicId) {
      epicsToPush = epicsToPush.filter((e) => e.id === epicId);
      await GeneratedBacklog.updateOne(
        { _id: backlogId, "epic_statuses.epic_id": epicId },
        { $set: { "epic_statuses.$.status": "pushing" } }
      );
    } else {
      for (const epic of backlog.epic_statuses) {
        if (epic.status === "pending_review") epic.status = "pushing";
      }
      await backlog.save();
    }

    // Reconstruct Jira-compatible structure
    const structuredEpics = [];
    for (const epicDef of epicsToPush) {
      const epicObj = { title: epicDef.title, description: epicDef.description, issues: [] };
      const stories = backlog.stories.filter((s) => s.epic_id === epicDef.id);
      for (const story of stories) {
        epicObj.issues.push({
          type: "story",
          summary: story.user_story,
          description: story.description,
          acceptance_criteria: story.acceptance_criteria,
          priority: story.priority,
          story_points: story.story_points,
          sub_issues: (story.subtasks || []).map((st) => ({
            type: "subtask",
            summary: st.title,
            description: st.description,
            acceptance_criteria: st.acceptance_criteria,
            priority: st.priority,
            story_points: st.story_points,
          })),
        });
      }
      structuredEpics.push(epicObj);
    }

    const suggestions = { data: { epics: structuredEpics } };
    const result = await pushAISuggestionsHierarchy({ client, projectKey: backlog.projectKey, suggestions });

    console.log(`[Push Worker] Push completed for backlog ${backlogId}. Success: ${result.success}`);

    // Update statuses
    if (epicId) {
      await GeneratedBacklog.updateOne(
        { _id: backlogId, "epic_statuses.epic_id": epicId },
        {
          $set: {
            "epic_statuses.$.status": result.success ? "pushed" : "failed",
            "epic_statuses.$.jira_push_result": result,
            "epic_statuses.$.pushed_at": new Date(),
          },
        }
      );
    } else {
      for (const epicStatus of backlog.epic_statuses) {
        if (epicStatus.status === "pushing") {
          epicStatus.status = result.success ? "pushed" : "failed";
          epicStatus.jira_push_result = result;
          epicStatus.pushed_at = new Date();
        }
      }
      await backlog.save();
    }

    // Check overall status
    const updatedBacklog = await GeneratedBacklog.findById(backlogId);
    if (updatedBacklog) {
      const allPushed = updatedBacklog.epic_statuses.every((e) => e.status === "pushed");
      const somePushed = updatedBacklog.epic_statuses.some((e) => e.status === "pushed");
      updatedBacklog.status = allPushed ? "fully_pushed" : somePushed ? "partially_pushed" : "pending_review";
      await updatedBacklog.save();
    }

    return { success: result.success, backlogId, epicId };
  },
  {
    connection,
    concurrency: 1,
  }
);

pushWorker.on("completed", (job) => {
  console.log(`[Push Worker] Job ${job.id} completed`);
});

pushWorker.on("failed", (job, err) => {
  console.error(`[Push Worker] Job ${job?.id} failed:`, err.message);
});
