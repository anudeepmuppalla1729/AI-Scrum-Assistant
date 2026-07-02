import GeneratedBacklog from "../models/GeneratedBacklog.js";
import { getJiraClient } from "../integrations/jira/services/jiraClient.js";
import { pushAISuggestionsHierarchy } from "../integrations/jira/services/transformers/hierarchy.service.js";

// In-memory queue for background Jira pushes
// This avoids needing Redis/BullMQ for local environments while still providing background processing
class PushWorkerQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  add(job) {
    this.queue.push(job);
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { backlogId, user, epicId } = this.queue.shift();

    try {
      console.log(`[Push Worker] Starting push for backlog ${backlogId}${epicId ? ` epic ${epicId}` : ' (all)'}`);
      
      const backlog = await GeneratedBacklog.findById(backlogId);
      if (!backlog) {
        throw new Error("Backlog not found");
      }

      const client = await getJiraClient(user);
      
      // Filter what to push
      let epicsToPush = backlog.orchestrator_contract.epics;
      if (epicId) {
        epicsToPush = epicsToPush.filter(e => e.id === epicId);
        // Mark epic as pushing
        await GeneratedBacklog.updateOne(
          { _id: backlogId, "epic_statuses.epic_id": epicId },
          { $set: { "epic_statuses.$.status": "pushing" } }
        );
      } else {
        // Mark all pending epics as pushing
        await GeneratedBacklog.updateOne(
          { _id: backlogId },
          { status: "pushing" } // Not an enum value in model, maybe use 'partially_pushed' as intermediate? Let's stick to updating epic statuses.
        );
        for (const epic of backlog.epic_statuses) {
           if (epic.status === "pending_review") {
             epic.status = "pushing";
           }
        }
        await backlog.save();
      }

      // Reconstruct the 'suggestions' structure expected by pushAISuggestionsHierarchy
      // hierarchy.service expects: { data: { epics: [ { title, description, issues: [ { summary, description, sub_issues: [] } ] } ] } }
      
      const structuredEpics = [];
      for (const epicDef of epicsToPush) {
        const epicObj = {
          title: epicDef.title,
          description: epicDef.description,
          issues: []
        };

        // Find stories for this epic
        const stories = backlog.stories.filter(s => s.epic_id === epicDef.id);
        for (const story of stories) {
          epicObj.issues.push({
            type: "story",
            summary: story.user_story,
            description: story.description,
            acceptance_criteria: story.acceptance_criteria,
            priority: story.priority,
            story_points: story.story_points,
            sub_issues: (story.subtasks || []).map(st => ({
              type: "subtask",
              summary: st.title,
              description: st.description,
              acceptance_criteria: st.acceptance_criteria,
              priority: st.priority,
              story_points: st.story_points,
            }))
          });
        }
        structuredEpics.push(epicObj);
      }

      const suggestions = { data: { epics: structuredEpics } };

      const result = await pushAISuggestionsHierarchy({
        client,
        projectKey: backlog.projectKey,
        suggestions,
      });

      console.log(`[Push Worker] Push completed for backlog ${backlogId}. Success: ${result.success}`);

      // Update statuses
      if (epicId) {
        await GeneratedBacklog.updateOne(
          { _id: backlogId, "epic_statuses.epic_id": epicId },
          { 
            $set: { 
              "epic_statuses.$.status": result.success ? "pushed" : "failed",
              "epic_statuses.$.jira_push_result": result,
              "epic_statuses.$.pushed_at": new Date()
            } 
          }
        );
      } else {
        // Update all that were pushing
        for (const epicStatus of backlog.epic_statuses) {
          if (epicStatus.status === "pushing") {
            epicStatus.status = result.success ? "pushed" : "failed";
            epicStatus.jira_push_result = result;
            epicStatus.pushed_at = new Date();
          }
        }
        await backlog.save();
      }

      // Re-fetch backlog to check all statuses
      const updatedBacklog = await GeneratedBacklog.findById(backlogId);
      if (updatedBacklog) {
        const allPushed = updatedBacklog.epic_statuses.every(e => e.status === "pushed");
        const somePushed = updatedBacklog.epic_statuses.some(e => e.status === "pushed");
        updatedBacklog.status = allPushed ? "fully_pushed" : (somePushed ? "partially_pushed" : "pending_review");
        await updatedBacklog.save();
      }

    } catch (error) {
      console.error(`[Push Worker] Error pushing backlog ${backlogId}:`, error);
      // Mark as failed
      if (epicId) {
         await GeneratedBacklog.updateOne(
          { _id: backlogId, "epic_statuses.epic_id": epicId },
          { $set: { "epic_statuses.$.status": "failed" } }
        );
      } else {
         for (const epicStatus of backlog.epic_statuses) {
           if (epicStatus.status === "pushing") {
             epicStatus.status = "failed";
           }
         }
         await backlog.save();
      }
      
      const updatedBacklog = await GeneratedBacklog.findById(backlogId);
      if (updatedBacklog) {
        const somePushed = updatedBacklog.epic_statuses.some(e => e.status === "pushed");
        updatedBacklog.status = somePushed ? "partially_pushed" : "pending_review";
        await updatedBacklog.save();
      }
    }

    // Process next in queue
    this.processNext();
  }
}

export const pushWorker = new PushWorkerQueue();
