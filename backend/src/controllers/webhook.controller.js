import { upsertTicket, upsertSprint } from "../services/ai/rag.service.js";
import { generateSprintRetrospective } from "../services/automation/automation.service.js";
import User from "../models/User.js";
import { getJiraClient } from "../services/jira/jiraClient.js";

export const handleJiraWebhook = async (req, res) => {
  try {
    console.log("Received webhook:", req.body);
    const event = req.body.webhookEvent;
    const { issue, sprint } = req.body;

    console.log(`Received Jira webhook: ${event}`);

    if (event.startsWith("jira:issue_")) {
      if (issue) {
        const ticketData = {
          key: issue.key,
          summary: issue.fields.summary,
          description: issue.fields.description,
          status: issue.fields.status.name,
          assignee: issue.fields.assignee
            ? issue.fields.assignee.displayName
            : null,
          priority: issue.fields.priority ? issue.fields.priority.name : "None",
          issuetype: issue.fields.issuetype.name,
          updated: issue.fields.updated,
        };
        await upsertTicket(ticketData);
      }
    } else if (event.startsWith("sprint_")) {
      // Note: Jira sprint events might have different payload structures depending on configuration
      // Assuming standard agile board webhook
      if (sprint) {
        const sprintData = {
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          goal: sprint.goal,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
        };
        await upsertSprint(sprintData);

        if (event === "sprint_closed") {
          console.log(
            `Sprint ${sprint.name} closed. Generating retrospective...`
          );
          
          let user = null;
          if (req.body.user && req.body.user.accountId) {
            user = await User.findOne({ atlassianAccountId: req.body.user.accountId });
          }
          
          if (!user) {
             console.warn("Could not find specific user who closed sprint in DB. Falling back to any connected user.");
             user = await User.findOne({ "jiraTokens.accessToken": { $exists: true } });
          }

          if (user) {
            const client = await getJiraClient(user);
            const retro = await generateSprintRetrospective(client, sprint.id);
            console.log("Retrospective generated:", retro);
            // In a real app, we would email this or post it to a Slack channel
          } else {
            console.error("No valid Jira users found in database to process webhook API calls. Skipping retrospective.");
          }
        }
      }
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).send("Error handling webhook");
  }
};
