# Push AI Suggestions to Jira (Team-managed)

## Summary

Create a POST route to accept the AI output and create Jira issues in Team-managed projects with the hierarchy: Epic → Story (parent=epic) → Sub-task (parent=story). Use existing `jiraClient.js` and add a dedicated transformer + service with id mapping, validation via Zod, and partial-failure reporting.

## Key Decisions

- Team-managed linking: stories use `parent` pointing to Epic; sub-tasks use `parent` pointing to Story
- Epic name from `epic.title`; Story fields from `summary`, `description`, `priority`, `story_points`
- Sub-issues become Sub-tasks under their Story
- Project is provided via request (e.g., `projectKey`) rather than hardcoded

## Files To Change or Add

- `backend/src/controllers/scrum.controller.js`: add route handler to accept AI suggestions
- `backend/src/services/jira/issue_service.js`: add hierarchical creation function using `jiraClient`
- `backend/src/services/jira/transformers/ticketTransformer.service.js`: implement payload mappers for Epic/Story/Sub-task
- `backend/src/utils/schemas.js`: add/extend Zod schema to validate incoming AI suggestions
- `backend/src/services/jira/jiraClient.js`: ensure it exposes `createIssue`, `bulkCreate?` (if not, single create with retries)
- (Optional) `backend/src/routes/index.js` or wherever routes are registered

## Route Contract

- Method: POST `/api/jira/push-ai-suggestions`
- Body: `{ projectKey: string, suggestions: <AI JSON you shared> }`
- Response: `{ success: boolean, created: { epics: [...], stories: [...], subtasks: [...] }, errors: [...] }`

## Implementation Steps

1. Validate request body (projectKey required; suggestions shape validated against a Zod schema aligned to your AI output)
2. For each Epic in `suggestions.data.epics`:

- Create Epic issue; map fields; store `epicId`

3. For each Story under Epic:

- Create Story with `parent: { id: epicId }` (Team-managed epic child)
- Map `priority` and `story_points` (use `customfield_*` for Story Points if configured; else fallback none)

4. For each Sub-issue under Story:

- Create Sub-task with `parent: { id: storyId }`

5. Collect results and partial errors; return summary to client
6. Add retries (e.g., 429/5xx) with backoff; fail soft and continue siblings

## Field Mapping Notes

- Epic: `issuetype.name = 'Epic'`, `summary = epic.title`, `description`
- Story: `issuetype.name = 'Story'`, `parent.id = epicId`, `priority.name`, `summary`, `description`, `Story Points` custom field (configurable env `JIRA_STORY_POINTS_FIELD`)
- Sub-task: `issuetype.name = 'Sub-task'`, `parent.id = storyId`, `summary`, `description`, `priority`

## Error Handling

- Validate before calling Jira
- Continue on sibling errors; aggregate `errors[]` with context `{level: 'epic'|'story'|'subtask', parentSummary, summary, error}`
- Surface Jira API validation messages

## Security

- Use existing Jira auth in `jiraClient.js`
- Limit payload size and sanitize text fields

## Post-conditions

- All created issue keys/ids returned mapped to their source summaries for UI linkage
- Safe to call multiple times; avoid duplicates by optional `dryRun` and/or de-dup key (not in first cut)