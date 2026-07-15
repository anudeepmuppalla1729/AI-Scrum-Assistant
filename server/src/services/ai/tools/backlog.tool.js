import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getJiraClient, searchIssues } from "../../../integrations/jira/services/jiraClient.js";

/**
 * Creates a backlog search tool bound to a specific user's Jira credentials.
 * The tool searches for existing epics, stories, and tasks in the user's Jira project
 * so the AI can suggest proper parent linking for new backlog items.
 */
export const createBacklogSearchTool = (userId) => {
  return tool(
    async ({ projectKey, searchText, issueType }) => {
      try {
        const client = await getJiraClient({ userId });

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

        const { issues } = await searchIssues(client, {
          jql,
          maxResults: 20,
          fields: ["summary", "issuetype", "status", "parent", "priority", "description"],
        });

        const mapped = issues.map((issue) => ({
          key: issue.key,
          summary: issue.fields?.summary,
          type: issue.fields?.issuetype?.name,
          status: issue.fields?.status?.name,
          parentKey: issue.fields?.parent?.key || null,
          parentSummary: issue.fields?.parent?.fields?.summary || null,
          priority: issue.fields?.priority?.name || null,
        }));

        return JSON.stringify({
          totalResults: mapped.length,
          issues: mapped,
        });
      } catch (error) {
        console.error(
          "Backlog search tool error:",
          error.response?.data || error.message,
        );

        if (error.message?.includes("Jira") || error.response?.status === 401) {
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
            "Text to search for in issue summaries and descriptions. Use keywords related to the user's requirement.",
          ),
        issueType: z
          .enum(["Epic", "Story", "Task", "Bug"])
          .optional()
          .describe(
            "Filter by issue type. Use 'Epic' when looking for parent Epics, 'Story' when looking for parent Stories.",
          ),
      }),
    },
  );
};
