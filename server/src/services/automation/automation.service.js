import { model } from "../ai/model.service.js";
import { queryKnowledgeBase } from "../ai/rag.service.js";
import { search } from "../jira/issue_service.js";

export const generateDailyStandup = async (client, projectKey) => {
  try {
    // 1. Fetch Active Sprint Issues
    // JQL: project = KEY AND sprint in openSprints()
    const issues = await search(
      client,
      `project = "${projectKey}" AND sprint in openSprints()`
    );
    console.log(
      `Found ${issues.length} issues for standup in project ${projectKey}`
    );

    // 2. Categorize Issues
    const completedYesterday = [];
    const workingOnToday = [];
    const blockers = [];

    issues.forEach((issue) => {
      const status = issue.fields.status.name;
      const summary = `${issue.key}: ${issue.fields.summary}`;

      if (status === "Done") {
        completedYesterday.push(summary);
      } else if (status === "In Progress") {
        workingOnToday.push(summary);
      } else if (status === "Blocked") {
        blockers.push(summary);
      }
    });

    const prompt = `Generate a Daily Standup summary for the team based on the following live Jira data:

Completed Recently:
${completedYesterday.join("\n")}

In Progress:
${workingOnToday.join("\n")}

Blockers:
${blockers.join("\n")}

Format:
- **Completed Yesterday**: ...
- **Working on Today**: ...
- **Blockers**: ...`;

    const response = await model.invoke(prompt);
    return response.content;
  } catch (error) {
    console.error("Error generating standup:", error);
    throw new Error("Failed to generate daily standup.");
  }
};

export const generateSprintRetrospective = async (client, sprintId) => {
  try {
    // 1. Fetch Sprint Issues from Jira
    // Assuming sprintId is the ID, JQL: sprint = <id>
    // JQL requires the ID to be unquoted if it's a number, or quoted if it's a name.
    // However, the error "Expecting either 'OR' or 'AND' but got 'Sprint'" suggests a malformed query string.
    // It's likely `sprintId` is being interpolated incorrectly or the JQL parser is strict.
    // Let's ensure sprintId is treated correctly.
    const issues = await search(client, `sprint = "${sprintId}"`);

    // 2. Calculate Metrics
    let plannedPoints = 0;
    let completedPoints = 0;
    let bugsCount = 0;
    let blockedCount = 0;

    issues.forEach((issue) => {
      const points = issue.fields.customfield_10002 || 0; // Adjust custom field ID if needed
      plannedPoints += points;

      if (
        issue.fields.status.name === "Done" ||
        issue.fields.status.name === "Closed"
      ) {
        completedPoints += points;
      }

      if (issue.fields.issuetype.name === "Bug") {
        bugsCount++;
      }

      if (issue.fields.status.name === "Blocked" || issue.fields.flagged) {
        blockedCount++;
      }
    });

    // 3. Fetch RAG Context (optional, for qualitative data)
    const contextDocs = await queryKnowledgeBase(
      `sprint ${sprintId} retrospective`,
      5
    );
    const contextText = contextDocs.map((doc) => doc.content).join("\n");

    // 4. Generate AI Report
    const prompt = `You are an AI Scrum Master. Generate a Sprint Retrospective based on the following data:

Sprint Data:
- Planned Story Points: ${plannedPoints}
- Completed Story Points: ${completedPoints}
- Bugs Found: ${bugsCount}
- Blocked Issues: ${blockedCount}
- Context from Knowledge Base: ${contextText}

Output Format:
Sprint delivery dropped by [X]% (if applicable) due to [Reason].
Root cause likely [Reason].
Recommended actions:
- [Action 1]
- [Action 2]
- [Action 3]

Keep it concise and actionable.`;

    const response = await model.invoke(prompt);
    return response.content;
  } catch (error) {
    console.error("Error generating retrospective:", error);
    throw new Error("Failed to generate sprint retrospective.");
  }
};
