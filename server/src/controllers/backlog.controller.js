import axios from "axios";
import User from "../models/User.js";
import PushedBacklog from "../models/PushedBacklog.js";

/**
 * Push a single crafted backlog item to Jira with proper parent linking.
 */
export const pushBacklogItem = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!process.env.JIRA_HOST || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
      return res.status(500).json({ error: "Jira Basic Auth credentials missing in .env" });
    }

    const basicAuth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN.replace(/"/g, '')}`
    ).toString('base64');

    const { projectKey, sessionId, item } = req.body;

    if (!projectKey || !item || !item.summary || !item.type) {
      return res
        .status(400)
        .json({ error: "projectKey, item.type, and item.summary are required." });
    }

    // Build Jira issue payload
    const fields = {
      project: { key: projectKey },
      issuetype: { name: item.type },
      summary: item.summary,
    };

    // Add description in Atlassian Document Format
    if (item.description) {
      const descriptionContent = [
        {
          type: "paragraph",
          content: [{ type: "text", text: item.description }],
        },
      ];

      // Append acceptance criteria if present
      if (
        item.acceptanceCriteria &&
        Array.isArray(item.acceptanceCriteria) &&
        item.acceptanceCriteria.length > 0
      ) {
        descriptionContent.push({
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Acceptance Criteria" }],
        });
        descriptionContent.push({
          type: "bulletList",
          content: item.acceptanceCriteria.map((ac) => ({
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: ac }],
              },
            ],
          })),
        });
      }

      fields.description = {
        type: "doc",
        version: 1,
        content: descriptionContent,
      };
    }

    // Link to parent (for team-managed projects, use parent field)
    if (item.parentKey) {
      fields.parent = { key: item.parentKey };
    }

    // Priority
    if (item.priority) {
      fields.priority = { name: item.priority };
    }

    // Story points (custom field — fallback to env var)
    const storyPointsField =
      process.env.JIRA_STORY_POINTS_FIELD || "customfield_10016";
    if (item.storyPoints && item.type !== "Epic" && typeof item.storyPoints === "number") {
      fields[storyPointsField] = item.storyPoints;
    }

    // Create the issue via Jira API
    const url = `${process.env.JIRA_HOST}/rest/api/3/issue`;
    const response = await axios.post(
      url,
      { fields },
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const createdIssue = response.data;

    const jiraUrl = `${process.env.JIRA_HOST}/browse/${createdIssue.key}`;

    // Save to push history
    const pushedItem = new PushedBacklog({
      userId,
      sessionId: sessionId || null,
      projectKey,
      jiraKey: createdIssue.key,
      jiraId: createdIssue.id,
      type: item.type,
      summary: item.summary,
      description: item.description,
      storyPoints: item.storyPoints,
      priority: item.priority,
      parentKey: item.parentKey || null,
      parentSummary: item.parentSummary || null,
      jiraUrl,
    });
    await pushedItem.save();

    return res.status(201).json({
      success: true,
      jiraKey: createdIssue.key,
      jiraId: createdIssue.id,
      jiraUrl,
      pushedItem,
    });
  } catch (err) {
    if (err.response?.status === 401) {
      console.error("Jira Access Token Expired");
      return res
        .status(401)
        .json({ error: "Jira session expired. Please login again." });
    }
    console.error(
      "Backlog push error:",
      err.response?.data || err.message || err
    );
    return res.status(500).json({
      error: "Failed to push backlog item to Jira.",
      details: err.response?.data || err.message,
    });
  }
};

/**
 * Get push history for the authenticated user.
 * Optionally filter by sessionId query param.
 */
export const getPushHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.query;

    const filter = { userId };
    if (sessionId) {
      filter.sessionId = sessionId;
    }

    const history = await PushedBacklog.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(history);
  } catch (err) {
    console.error("Push history fetch error:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch push history." });
  }
};

/**
 * Search existing Jira backlog items for parent linking.
 * Used by the frontend parent-linking dropdown.
 */
export const searchBacklog = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!process.env.JIRA_HOST || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
      return res.status(500).json({ error: "Jira Basic Auth credentials missing in .env" });
    }

    const basicAuth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN.replace(/"/g, '')}`
    ).toString('base64');

    const { projectKey, query, issueType } = req.query;
    if (!projectKey) {
      return res.status(400).json({ error: "projectKey is required." });
    }

    let jql = `project = "${projectKey}"`;
    if (issueType) {
      jql += ` AND issuetype = "${issueType}"`;
    } else {
      jql += ` AND issuetype in ("Epic", "Story")`;
    }
    if (query) {
      jql += ` AND summary ~ "${query}"`;
    }
    jql += ` ORDER BY updated DESC`;

    const url = `${process.env.JIRA_HOST}/rest/api/3/search/jql`;
    const params = new URLSearchParams({
      jql,
      maxResults: "15",
      fields: "summary,issuetype,status,parent",
    });
    const response = await axios.get(
      `${url}?${params.toString()}`,
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          Accept: "application/json",
        },
      }
    );

    const issues = (response.data?.issues || []).map((issue) => ({
      key: issue.key,
      summary: issue.fields?.summary,
      type: issue.fields?.issuetype?.name,
      status: issue.fields?.status?.name,
      parentKey: issue.fields?.parent?.key || null,
    }));

    return res.status(200).json(issues);
  } catch (err) {
    if (err.response?.status === 401) {
      return res
        .status(401)
        .json({ error: "Jira session expired. Please login again." });
    }
    console.error("Backlog search error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to search backlogs." });
  }
};
