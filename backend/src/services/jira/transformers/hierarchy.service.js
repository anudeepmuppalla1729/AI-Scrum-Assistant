import { createIssueWithRetry, resolveIssueTypeId } from "../jiraClient.js";
import {
  toEpicCreatePayload,
  toStoryCreatePayload,
  toSubtaskCreatePayload,
} from "./ticketTransformer.service.js";

export async function pushAISuggestionsHierarchy({ projectKey, suggestions }) {
  const created = { epics: [], stories: [], subtasks: [] };
  const errors = [];

  // Resolve issue type IDs once
  let subtaskTypeId = null;
  try {
    subtaskTypeId = await resolveIssueTypeId(projectKey, (t) => {
      // Prefer types flagged as subtask, fallback to name contains
      return t?.subtask === true || /sub-?task/i.test(t?.name || "");
    });
  } catch (e) {
    // ignore; will attempt name fallback
  }

  const epics = suggestions?.data?.epics || [];
  if (!Array.isArray(epics) || epics.length === 0) {
    return { success: true, created, errors };
  }

  for (const epic of epics) {
    let epicIssue;
    try {
      const epicPayload = toEpicCreatePayload({ projectKey, epic });
      epicIssue = await createIssueWithRetry(epicPayload);
      created.epics.push({
        id: epicIssue.id,
        key: epicIssue.key,
        summary: epic.title,
      });
      created.epics.push({
        id: epicIssue.id,
        key: epicIssue.key,
        summary: epic.title,
      });
    } catch (err) {
      console.error(`Failed to create Epic "${epic.title}":`, err?.response?.data || err.message);
      errors.push({
        level: "epic",
        summary: epic?.title,
        error: err?.response?.data || err?.message || String(err),
      });
      continue;
    }

    const epicId = epicIssue.id;
    const issues = Array.isArray(epic?.issues) ? epic.issues : [];

    for (const issue of issues) {
      if ((issue?.type || "").toLowerCase() !== "story") continue;

      let storyIssue;
      try {
        const storyPayload = toStoryCreatePayload({
          projectKey,
          story: issue,
          epicId,
        });
        storyIssue = await createIssueWithRetry(storyPayload);
        created.stories.push({
          id: storyIssue.id,
          key: storyIssue.key,
          summary: issue.summary,
          parentEpicKey: epicIssue.key,
        });
      } catch (err) {
        console.error(`Failed to create Story "${issue.summary}":`, err?.response?.data || err.message);
        errors.push({
          level: "story",
          parentSummary: epic?.title,
          summary: issue?.summary,
          error: err?.response?.data || err?.message || String(err),
        });
        continue;
      }

      const storyId = storyIssue.id;
      const subIssues = Array.isArray(issue?.sub_issues)
        ? issue.sub_issues
        : [];

      for (const sub of subIssues) {
        try {
          const subPayload = toSubtaskCreatePayload({
            projectKey,
            subtask: sub,
            storyId,
            issueTypeId: subtaskTypeId,
          });
          const subIssue = await createIssueWithRetry(subPayload);
          created.subtasks.push({
            id: subIssue.id,
            key: subIssue.key,
            summary: sub.summary,
            parentStoryKey: storyIssue.key,
          });
        } catch (err) {
          console.error(`Failed to create Subtask "${sub.summary}":`, err?.response?.data || err.message);
          errors.push({
            level: "subtask",
            parentSummary: issue?.summary,
            summary: sub?.summary,
            error: err?.response?.data || err?.message || String(err),
          });
        }
      }
    }
  }

  return { success: errors.length === 0, created, errors };
}
