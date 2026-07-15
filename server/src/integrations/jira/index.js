/**
 * JIRA Integration Layer — Barrel Export
 *
 * All JIRA interactions should go through this module.
 * Never use raw axios + Basic Auth; always use the SDK-backed helpers here.
 */
export {
  getJiraClient,
  createIssueWithRetry,
  resolveIssueTypeId,
  searchIssues,
  createIssue,
} from "./services/jiraClient.js";

export { search } from "./services/issue_service.js";

export { pushAISuggestionsHierarchy } from "./services/transformers/hierarchy.service.js";
