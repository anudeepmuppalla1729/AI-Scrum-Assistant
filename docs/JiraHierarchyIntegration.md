## Jira Hierarchy Integration (Team-managed) — What we built and why

This guide explains, in plain terms, how we turned your AI output into real Jira issues for a Team‑managed project in the hierarchy Epic → Story (parent = Epic) → Sub‑task (parent = Story). It also clarifies why we used Jira “Create Meta” and how errors are handled.

### Overview

- Input: AI suggestions JSON (epics → stories → sub_issues)
- Output: Jira tickets created in a Team-managed project:
  - Epics
  - Stories (using `parent.id = epicId`)
  - Sub-tasks (using `parent.id = storyId`)
- Robust to project-specific naming and configuration differences by using Jira Create Meta to discover issue type IDs.

---

### 1) Transformers: turning AI objects into Jira payloads

File: `backend/src/services/jira/transformers/ticketTransformer.service.js`

Purpose:

- Ensure fields match Jira expectations (e.g., `project`, `issuetype`, `summary`, `description`).
- Use minimal ADF (Atlassian Document Format) for `description` because Jira Cloud v3 requires it.
- Map optional fields like Priority and Story Points when available.

Small reference (not full code):

```javascript
// Minimal text → ADF
const textToADF = (text = "") => ({
  type: "doc",
  version: 1,
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

const withPriority = (fields, priorityName) => {
  if (!priorityName) return fields;
  return { ...fields, priority: { name: priorityName } };
};

const withStoryPoints = (fields, storyPoints) => {
  const customFieldId = process.env.JIRA_STORY_POINTS_FIELD;
  if (!customFieldId || storyPoints == null) return fields;
  return { ...fields, [customFieldId]: storyPoints };
};

export const toEpicCreatePayload = ({ projectKey, epic }) => ({
  fields: {
    project: { key: projectKey },
    issuetype: { name: "Epic" },
    summary: epic.title,
    description: epic.description ? textToADF(epic.description) : undefined,
  },
});

export const toStoryCreatePayload = ({ projectKey, story, epicId }) => {
  let fields = {
    project: { key: projectKey },
    issuetype: { name: "Story" },
    parent: { id: epicId },
    summary: story.summary,
    description: story.description ? textToADF(story.description) : undefined,
  };
  fields = withPriority(fields, story.priority);
  fields = withStoryPoints(fields, story.story_points);
  return { fields };
};

// Accepts optional issueTypeId to be resilient to naming differences
export const toSubtaskCreatePayload = ({
  projectKey,
  subtask,
  storyId,
  issueTypeId,
}) => {
  let fields = {
    project: { key: projectKey },
    issuetype: issueTypeId ? { id: issueTypeId } : { name: "Subtask" },
    parent: { id: storyId },
    summary: subtask.summary,
    description: subtask.description
      ? textToADF(subtask.description)
      : undefined,
  };
  fields = withPriority(fields, subtask.priority);
  return { fields };
};
```

Why this matters:

- ADF prevents description parsing errors.
- Using IDs (when available) avoids naming pitfalls (e.g., “Subtask” vs “Sub‑task”).
- Story Points differ by site; we read the custom field ID from env (`JIRA_STORY_POINTS_FIELD`). If not set, we skip it safely.

---

### 2) Jira Client — Retry and Create Meta, in human terms

File: `backend/src/services/jira/jiraClient.js`

What we added:

- A retry wrapper for “create issue” that backs off on rate limits (429) and temporary errors (5xx).
- “Create Meta” helpers to ask Jira which issue types are actually creatable in your project, and which one is a sub‑task.

```javascript
export const createIssueWithRetry = async (issuePayload, options = {}) => {
  const { retries = 3, baseDelayMs = 500, onRetry } = options;
  let attempt = 0;
  let lastErr;

  while (attempt <= retries) {
    try {
      return await jiraClient.issues.createIssue(issuePayload);
    } catch (err) {
      const status = err?.response?.status || err?.status;
      const isRetryable = status === 429 || (status >= 500 && status < 600);
      if (!isRetryable || attempt === retries) throw err;

      const retryAfterHeader =
        err?.response?.headers?.["retry-after"] ||
        err?.response?.headers?.["Retry-After"];
      const retryAfterMs = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : null;
      const delay =
        retryAfterMs != null
          ? retryAfterMs
          : Math.round(baseDelayMs * Math.pow(2, attempt));
      if (typeof onRetry === "function") {
        try {
          onRetry({ attempt: attempt + 1, status, delay });
        } catch {}
      }
      await new Promise((r) => setTimeout(r, delay));
      attempt += 1;
      lastErr = err;
    }
  }
  throw lastErr;
};

// Create Meta helpers (cached)
const _createMetaCache = new Map();

export const getCreateMetaForProject = async (projectKey) => {
  const cacheKey = projectKey;
  if (_createMetaCache.has(cacheKey)) return _createMetaCache.get(cacheKey);

  const resp = await jiraClient.issueCreateMetadata.getCreateIssueMeta({
    projectKeys: [projectKey],
    expand: ["projects.issuetypes.fields"],
  });

  const meta = resp?.projects?.[0] || null;
  _createMetaCache.set(cacheKey, meta);
  return meta;
};

export const resolveIssueTypeId = async (projectKey, predicate) => {
  const meta = await getCreateMetaForProject(projectKey);
  const types = meta?.issuetypes || [];
  const match = types.find(predicate);
  return match?.id || null;
};
```

Why Create Meta?

- Jira projects can rename or disable issue types (e.g., “Subtask” vs “Sub‑task”). We avoid guessing and use the type ID Jira tells us is valid. This is why your sub‑tasks started creating reliably.

---

### 3) Hierarchy Service: create Epic → Stories → Sub‑tasks

File: `backend/src/services/jira/transformers/hierarchy.service.js`

What it does:

- Resolves the sub‑task issue type ID once (via Create Meta).
- Creates the Epic.
- Creates each Story under the Epic (in Team‑managed Jira, Stories use `parent.id = epicId`).
- For each Story, creates its `sub_issues` as Sub‑tasks (`parent.id = storyId`).
- Records successes (ids/keys/summaries) and collects detailed errors for any failures.

```javascript
import { createIssueWithRetry, resolveIssueTypeId } from "../jiraClient.js";
import {
  toEpicCreatePayload,
  toStoryCreatePayload,
  toSubtaskCreatePayload,
} from "./ticketTransformer.service.js";

export async function pushAISuggestionsHierarchy({ projectKey, suggestions }) {
  const created = { epics: [], stories: [], subtasks: [] };
  const errors = [];

  // Resolve sub-task issue type id (robust to naming)
  let subtaskTypeId = null;
  try {
    subtaskTypeId = await resolveIssueTypeId(
      projectKey,
      (t) => t?.subtask === true || /sub-?task/i.test(t?.name || "")
    );
  } catch {}

  const epics = suggestions?.data?.epics || [];
  if (!Array.isArray(epics) || epics.length === 0)
    return { success: true, created, errors };

  for (const epic of epics) {
    let epicIssue;
    try {
      const epicPayload = toEpicCreatePayload({ projectKey, epic });
      epicIssue = await createIssueWithRetry(epicPayload);
      created.epics.push({
        id: epicIssue.id,
        key: epicIssue.key,
        summary: epic.title,
      });
    } catch (err) {
      errors.push({
        level: "epic",
        summary: epic?.title,
        error: err?.response?.data || err?.message || String(err),
      });
      continue;
    }

    const epicId = epicIssue.id;
    const issues = Array.isArray(epic?.issues) ? epic.issues : [];

    for (const issue of issues) {
      if ((issue?.type || "").toLowerCase() !== "story") continue;

      let storyIssue;
      try {
        const storyPayload = toStoryCreatePayload({
          projectKey,
          story: issue,
          epicId,
        });
        storyIssue = await createIssueWithRetry(storyPayload);
        created.stories.push({
          id: storyIssue.id,
          key: storyIssue.key,
          summary: issue.summary,
          parentEpicKey: epicIssue.key,
        });
      } catch (err) {
        errors.push({
          level: "story",
          parentSummary: epic?.title,
          summary: issue?.summary,
          error: err?.response?.data || err?.message || String(err),
        });
        continue;
      }

      const storyId = storyIssue.id;
      const subIssues = Array.isArray(issue?.sub_issues)
        ? issue.sub_issues
        : [];

      for (const sub of subIssues) {
        try {
          const subPayload = toSubtaskCreatePayload({
            projectKey,
            subtask: sub,
            storyId,
            issueTypeId: subtaskTypeId,
          });
          const subIssue = await createIssueWithRetry(subPayload);
          created.subtasks.push({
            id: subIssue.id,
            key: subIssue.key,
            summary: sub.summary,
            parentStoryKey: storyIssue.key,
          });
        } catch (err) {
          errors.push({
            level: "subtask",
            parentSummary: issue?.summary,
            summary: sub?.summary,
            error: err?.response?.data || err?.message || String(err),
          });
        }
      }
    }
  }

  return { success: errors.length === 0, created, errors };
}
```

Behavior:

- Continues on siblings when errors happen (partial success), while aggregating error details.
- Only Stories are created under each Epic; all `sub_issues` under each Story are created as Sub‑tasks.

---

### 4) Controller and Route: how you call this

- Controller validates the POST body with Zod and calls the service.
  - `backend/src/controllers/scrum.controller.js`

```javascript
import { PushAISuggestionsBodySchema } from "../utils/schemas.js";
import { pushAISuggestionsHierarchy } from "../services/jira/transformers/hierarchy.service.js";

export const pushAISuggestionsToJira = async (req, res) => {
  try {
    const parsed = PushAISuggestionsBodySchema.parse(req.body);
    const { projectKey, suggestions } = parsed;

    const result = await pushAISuggestionsHierarchy({
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
    if (zodIssues)
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: zodIssues,
      });
    console.error("Error pushing AI suggestions to Jira:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to push AI suggestions to Jira.",
    });
  }
};
```

- Route: mounted at `/api/v1/scrum/pushSuggestionsToJira`
  - `backend/src/routes/scrum.routes.js`

```javascript
import {
  generateSuggestions,
  pushAISuggestionsToJira,
} from "../controllers/scrum.controller.js";

router.post("/pushSuggestionsToJira", pushAISuggestionsToJira);
```

---

### 5) What is Create Meta? (simple definition)

Create Meta (Create Issue Metadata) is Jira’s description of what you can create in a project: available issue types, whether a type is a sub‑task, and the fields/allowed values for creation. We fetch it via the Jira client (`issueCreateMetadata.getCreateIssueMeta`) and use it to:

- Find the sub-task issue type for the project (`t.subtask === true`)
- Prefer IDs over names when creating issues to avoid name mismatches
- Optionally discover custom field IDs (e.g., Story Points) and required fields

Simplified example of the relevant shape:

```json
{
  "projects": [
    {
      "key": "SCRUM",
      "issuetypes": [
        { "id": "10001", "name": "Story", "subtask": false },
        { "id": "10002", "name": "Subtask", "subtask": true }
      ]
    }
  ]
}
```

---

### 6) Request/Response Contract (quick reference)

Endpoint: `POST /api/v1/scrum/pushSuggestionsToJira`

Body (shape):

```json
{
  "projectKey": "SCRUM",
  "suggestions": {
    "success": true,
    "message": "AI-generated suggestions retrieved successfully.",
    "data": {
      "epics": [
        {
          "title": "Epic X",
          "issues": [
            /* Stories with sub_issues */
          ]
        }
      ],
      "jira_issues": []
    }
  }
}
```

Response (shape):

```json
{
  "success": true,
  "created": { "epics": [], "stories": [], "subtasks": [] },
  "errors": []
}
```

---

### 7) Troubleshooting (answers, not stack traces)

- “Specify a valid issue type” for Sub‑tasks
  - Ensure Sub‑tasks feature is enabled for the Team‑managed project.
  - We now resolve and use the Sub‑task issue type ID from Create Meta (no guessing).
- Story Points not set
  - Confirm `JIRA_STORY_POINTS_FIELD` env var (e.g., `customfield_10016`) and that it’s available for Stories in Create Meta.

---

### 8) How to sanity‑test quickly

1. Call `POST /api/v1/scrum/pushSuggestionsToJira` with your AI payload and `projectKey`.
2. Confirm response lists created Epic/Story/Sub‑task keys and any itemized errors.
3. In Jira, verify: Epic exists → Stories show the Epic as parent → Sub‑tasks sit under Stories.
4. If Sub‑tasks fail, check project features and permissions; the response will include Jira’s validation message.
