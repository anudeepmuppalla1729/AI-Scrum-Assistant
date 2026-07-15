import { getJiraClient } from "../integrations/jira/services/jiraClient.js";
import { normalizeBoardId } from "../services/ai/rag.context.js";
import {
  generateDailyStandup,
  generateSprintRetrospective,
} from "../services/automation/automation.service.js";

/**
 * Generate a daily standup report using live JIRA data + AI.
 */
export const getDailyStandupReport = async (req, res) => {
  try {
    const { projectKey } = req.query;
    if (!projectKey)
      return res.status(400).json({ error: "Project key is required" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const client = await getJiraClient(req.user);

    const report = await generateDailyStandup(client, projectKey);
    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate a sprint retrospective report using JIRA sprint data + AI.
 */
export const getSprintRetrospectiveReport = async (req, res) => {
  try {
    const { sprintId } = req.query;
    const boardId = normalizeBoardId(req.query?.boardId);
    if (!sprintId)
      return res.status(400).json({ error: "Sprint ID is required" });

    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const client = await getJiraClient(req.user);

    const report = await generateSprintRetrospective(client, sprintId, boardId);
    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
