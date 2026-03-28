# Jira REST API Usage & Implementation Mapping

This document provides a comprehensive breakdown of exactly which Jira REST APIs our application interacts with, where they are executed in the codebase, and what version of the API they rely on.

*Note: The application utilizes both the native Jira V3 REST API (for managing issues) and the Jira Agile REST API 1.0 (for accessing sprint and board data).*

---

## 1. Issue Creation (`POST /rest/api/3/issue`)
**Where it's used:** 
- `backend/src/services/jira/issue_service.js` (using `jiraClient` wrapper)
- `backend/src/controllers/backlog.controller.js` (Custom Basic Auth Axios post)

**How it works:** 
Creates Epics, Stories, and Tasks. The payload requires a very strict nested structure inside a `fields` object. You must provide identifiers for the `project`, `issuetype`, and `summary`.

**Code Example:**
```javascript
const response = await axios.post(`${process.env.JIRA_HOST}/rest/api/3/issue`, {
  fields: {
    project: { key: "PROJ" },
    summary: "As a user, I want to login",
    description: "Full detailed description...",
    issuetype: { name: "Story" },
    // Custom Fields (like Story Points)
    customfield_10016: 5,
    // Parent Linking (Epic Link or native Parent)
    parent: { key: "PROJ-42" } 
  }
});
// Returns the newly created ticket, e.g., { id: "10000", key: "PROJ-43", self: "..." }
```

---

## 2. Advanced JQL Searching (`GET /rest/api/3/search/jql`)
**Where it's used:**
- `backend/src/services/ai/tools/backlog.tool.js` (The AI Agent's search mechanism)
- `backend/src/controllers/backlog.controller.js` (The frontend Parent Link Search)

**Why & How:**
This endpoint executes Jira Query Language (JQL) strings to find existing backlogs. Atlassian heavily deprecated the older `POST /search` and `GET /search` endpoints in favor of `/search/jql`.

**Code Example:**
```javascript
const jql = `project = "PROJ" AND issuetype = "Epic" AND summary ~ "\\"Auth\\"" ORDER BY updated DESC`;
const params = new URLSearchParams({
  jql: jql,
  maxResults: "15",
  fields: "summary,issuetype,status,parent" // Trimming the payload for performance
});
const response = await axios.get(`${process.env.JIRA_HOST}/rest/api/3/search/jql?${params}`);
```

---

## 3. Issue Editing (`PUT /rest/api/3/issue/{issueIdOrKey}`)
**Where it's used:**
- `backend/src/services/jira/issue_service.js` 
- Used heavily by PRD ingestion logic when updating existing stubs with AI-generated acceptance criteria.

**How it works:**
Overwrites specific fields on an already-existing ticket. Only the fields explicitly provided in the JSON body are updated.

---

## 4. Jira Platform Metadata (`GET /rest/api/3/issue/createmeta`)
**Where it's used:**
- `backend/src/services/jira/jiraClient.js` (Cached globally on startup)

**Why it's critical:**
Jira projects can be infinitely customized by administrators. Some projects use `Story Points`, some use `Story point estimate`. Some have `Tasks`, others have `Development Tasks`. We call this endpoint to download the raw "Schema" of the project to map our fields dynamically before calling `POST /issue`.

---

## 5. Agile Board APIs (`GET /rest/agile/1.0/board`)
**Where it's used:**
- `frontend/src/api/jiraApi.ts` -> backend proxies

**How it works:**
Unlike raw issues, Scrum Boards have their own parallel API (the Agile API). 
- `GET /rest/agile/1.0/board`: Fetches all boards (Sprint boards, Kanban boards) the user can see.
- `GET /rest/agile/1.0/board/{boardId}/sprint`: Fetches the Sprints explicitly scoped to that board.
- `GET /rest/agile/1.0/sprint/{sprintId}/issue`: Fetches every issue currently scheduled in that active sprint. This powers the Dashboard layout.

---

## Resolving V2 vs V3 Conflicts (The "Worst" part of payloads)
Jira V3 introduced a massive breaking change regarding Descriptions. In V2, descriptions were plain strings: `"This is a description"`.
In V3, Atlassian switched to **Atlassian Document Format (ADF)**, an aggressive, deeply nested JSON tree representing Rich Text.

**V3 Description:**
```json
"description": {
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "This is a description" }
      ]
    }
  ]
}
```
If an API request accidentally sends a raw string into a V3 description endpoint, Jira responds with an extremely vague `400 Bad Request` schema violation, which represents one of the most frustrating debug cycles when interacting with Jira APIs natively.
