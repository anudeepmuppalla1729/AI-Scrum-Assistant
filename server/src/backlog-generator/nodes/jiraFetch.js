import { getJiraClient, searchIssues } from "../../integrations/jira/services/jiraClient.js";
import User from "../../models/User.js";
import { AgileClient } from "jira.js";

const jiraFetchNode = async (state) => {
  const { userId, projectKey, boardId } = state;
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  const client = await getJiraClient(user);
  let openBugs = 0;
  try {
    const { total } = await searchIssues(client, {
      jql: `project = "${projectKey}" AND issuetype in (Bug, bug) AND statusCategory != Done`,
      maxResults: 0,
      fields: ["summary"],
    });
    openBugs = total;
  } catch (e) {
    console.warn("Failed to fetch open bugs, defaulting to 0", e);
  }
  let velocity = 20;
  let previous_sprints = [];
  if (boardId) {
    try {
      const agileClient = new AgileClient({
        host: `https://api.atlassian.com/ex/jira/${user.cloudId}`,
        authentication: {
          oauth2: {
            accessToken: user.jiraTokens.accessToken
          }
        }
      });
      const sprintsResult = await agileClient.board.getAllSprints({ boardId: Number(boardId), state: "closed" });
      const closedSprints = sprintsResult.values || [];
      const last3 = closedSprints.slice(-3);
      for (const sp of last3) {
        previous_sprints.push({
          id: sp.id.toString(),
          completed_points: 20,
          // mocked
          carried_over: [],
          retrospective_notes: ""
        });
      }
    } catch (e) {
      console.warn("Failed to fetch sprints, using mock data", e);
    }
  }
  return {
    jira_context: {
      velocity,
      sprint_cadence: 14,
      // 2 weeks typical
      team: {
        developers: 3,
        qa: 1,
        design: 1
      },
      previous_sprints,
      open_bugs: openBugs
    }
  };
};
export {
  jiraFetchNode
};
