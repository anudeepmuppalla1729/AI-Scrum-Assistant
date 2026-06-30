import GeneratedBacklog from "../../models/GeneratedBacklog.js";
import { emitAgentEvent } from "../agentEventBus.js";

const assemblerNode = async (state) => {
  const { written_stories, orchestrator_contract, userId, projectKey, sessionId } = state;
  let passed = 0;
  let failed = 0;
  const flagged_story_ids = [];
  const stories_per_sprint = {};
  for (const story of written_stories) {
    if (story.validation_status === "passed") {
      passed++;
    } else {
      failed++;
      flagged_story_ids.push(story.story_id);
    }
    if (story.sprint) {
      stories_per_sprint[story.sprint] = (stories_per_sprint[story.sprint] || 0) + 1;
    }
  }
  const validation_report = {
    total_stories: written_stories.length,
    passed,
    failed_and_flagged: failed,
    flagged_story_ids,
    total_sprints: orchestrator_contract.total_sprints,
    stories_per_sprint
  };

  // Build epic statuses from orchestrator contract
  const epic_statuses = (orchestrator_contract.epics || []).map(epic => ({
    epic_id: epic.id,
    status: "pending_review",
    jira_push_result: null,
    pushed_at: null,
  }));

  // Save to MongoDB for human-in-the-loop review
  let backlog_id = null;
  try {
    // Map written stories to include acceptance_criteria from the output
    const storiesForDb = written_stories.map(story => ({
      story_id: story.story_id,
      epic_id: story.epic_id,
      user_story: story.user_story || "Untitled Story",
      description: story.description || "",
      acceptance_criteria: story.acceptance_criteria || [],
      priority: story.priority || "P2",
      story_points: story.story_points || 3,
      sprint: story.sprint || 1,
      subtasks: (story.subtasks || []).map(st => ({
        title: st.title || "Subtask",
        description: st.description || "",
        acceptance_criteria: st.acceptance_criteria || [],
        priority: st.priority || "P2",
        story_points: st.story_points || 1,
      })),
      validation_status: story.validation_status || "passed",
      failure_reasons: story.failure_reasons || [],
      retry_count: story.retry_count || 0,
    }));

    const backlog = new GeneratedBacklog({
      userId,
      sessionId,
      projectKey,
      status: "pending_review",
      orchestrator_contract,
      stories: storiesForDb,
      epic_statuses,
      validation_report,
    });
    await backlog.save();
    backlog_id = backlog._id.toString();

    console.log(`✅ Generated backlog saved to MongoDB: ${backlog_id}`);

    // Emit event so dashboard and client know the backlog is ready for review
    emitAgentEvent("backlog_ready", {
      backlog_id,
      sessionId,
      total_stories: written_stories.length,
      passed,
      failed,
    });

  } catch (err) {
    console.error("Failed to save generated backlog to MongoDB:", err);
    // Don't throw — still return the validation report
  }

  return { validation_report, backlog_id };
};

export {
  assemblerNode
};
