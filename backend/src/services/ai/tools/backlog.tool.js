import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import User from "../../../models/User.js";

/**
 * Creates a backlog search tool bound to a specific user's Jira credentials.
 * The tool searches for existing epics, stories, and tasks in the user's Jira project
 * so the AI can suggest proper parent linking for new backlog items.
 */
export const createBacklogSearchTool = (userId) => {
  return tool(
    async ({ projectKey, searchText, issueType }) => {
      try {
        // Use Basic Auth from .env
        if (!process.env.JIRA_HOST || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
          return JSON.stringify({
            error: "Jira Basic Auth credentials not found in .env",
          });
        }
        
        const basicAuth = Buffer.from(
          `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN.replace(/"/g, '')}`
        ).toString('base64');

        // Build JQL query
        let jql = `project = "${projectKey}"`;

        if (issueType) {
          jql += ` AND issuetype = "${issueType}"`;
        } else {
          // Default: search epics and stories for linking context
          jql += ` AND issuetype in ("Epic", "Story", "Task")`;
        }

        if (searchText) {
          jql += ` AND (summary ~ "\\"${searchText}\\"" OR description ~ "\\"${searchText}\\"")`;
        }

        jql += ` ORDER BY updated DESC`;

        const url = `${process.env.JIRA_HOST}/rest/api/3/search/jql`;
        const params = new URLSearchParams({
          jql,
          maxResults: "20",
          fields: "summary,issuetype,status,parent,priority,description",
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
          parentSummary: issue.fields?.parent?.fields?.summary || null,
          priority: issue.fields?.priority?.name || null,
        }));

        return JSON.stringify({
          totalResults: response.data?.total || 0,
          issues,
        });
      } catch (error) {
        console.error(
          "Backlog search tool error:",
          error.response?.data || error.message
        );

        if (error.response?.status === 401) {
          return JSON.stringify({
            error:
              "Jira session expired. The user needs to re-authenticate with Jira.",
          });
        }

        return JSON.stringify({
          error: `Failed to search Jira backlogs: ${error.message}`,
        });
      }
    },
    {
      name: "jira_backlog_search",
      description: `Search the user's Jira project for existing backlog items (Epics, Stories, Tasks).
Use this tool to:
1. Find existing Epics that a new Story should be linked under
2. Find existing Stories that a new Task should be linked under
3. Discover related backlog items to avoid duplication
4. Provide the user with linking options when crafting new backlog items

ALWAYS call this tool when the user describes a new feature or requirement, so you can suggest whether it belongs under an existing Epic/Story or needs a new one.`,
      schema: z.object({
        projectKey: z
          .string()
          .describe("The Jira project key (e.g., 'SCRUM', 'PROJ')"),
        searchText: z
          .string()
          .optional()
          .describe(
            "Text to search for in issue summaries and descriptions. Use keywords related to the user's requirement."
          ),
        issueType: z
          .enum(["Epic", "Story", "Task", "Bug"])
          .optional()
          .describe(
            "Filter by issue type. Use 'Epic' when looking for parent Epics, 'Story' when looking for parent Stories."
          ),
      }),
    }
  );
};
