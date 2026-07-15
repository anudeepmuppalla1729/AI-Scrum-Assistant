import { PushAISuggestionsBodySchema } from "../utils/schemas.js";
import { getJiraClient } from "../integrations/jira/services/jiraClient.js";
import { pushAISuggestionsHierarchy } from "../integrations/jira/services/transformers/hierarchy.service.js";

/**
 * Push AI-generated backlog suggestions into JIRA using the hierarchy transformer.
 */
export const pushAISuggestionsToJira = async (req, res) => {
  try {
    const parsed = PushAISuggestionsBodySchema.parse(req.body);
    const { projectKey, suggestions } = parsed;

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const client = await getJiraClient(req.user);

    const result = await pushAISuggestionsHierarchy({
      client,
      projectKey,
      suggestions,
    });

    return res.status(200).json({
      success: result.success,
      created: result.created,
      errors: result.errors,
    });
  } catch (error) {
    const zodIssues = error?.issues || error?.errors;
    if (zodIssues) {
      console.error("Validation Error:", JSON.stringify(zodIssues, null, 2));
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: zodIssues,
      });
    }
    console.error("Error pushing AI suggestions to Jira:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to push AI suggestions to Jira.",
    });
  }
};
