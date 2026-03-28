# Authentication & API Integrations

This document details the modifications made to backend proxies and React component hierarchies to establish a bullet-proof, consistent logging and error-catching standard for authentication token lifetimes.

## 1. Global 401 Interceptors via Zustand

**The Problem:**
Initially, if any protected REST endpoint (Jira uploads, PRD searches) returned a `401 Unauthorized`, the frontend `handleAuthError` util implemented a hard-wipe:
```typescript
// Legacy Anti-pattern
localStorage.removeItem("token");
window.location.href = "/";
```
Because React router and shadow DOMs do not instantaneously block execution lines upon `location.href` assignments, the user was left staring at a corrupted page where error boundaries tripped (`Failed to push to Jira: Session Expired`), but the URL hadn't successfully changed yet, essentially generating a localized race condition locking the user locally.

**The Solution:**
Zustand controls global React reactivity seamlessly. All backend APIs (`scrumApi.ts`, `jiraApi.ts`, `backlogApi.ts`) were refactored to directly hook into `useAuthStore` to execute synchronized logouts.

```typescript
// Example from frontend/src/api/backlogApi.ts
import { useAuthStore } from "../store/useAuthStore";

const handleAuthError = (res: Response) => {
  if (res.status === 401) {
    console.warn("Received 401 - Logging out");
    // Intercepted by Protected Routes globally - instantly triggering an immutable render shift
    useAuthStore.getState().logout();
    throw new Error("Session expired. Please login again.");
  }
};
```
When `useAuthStore.getState().logout()` fires:
1. It deletes `localStorage('token')` natively.
2. It explicitly sets `{ token: null }` inside Zustand state.
3. The `<App>` component instantly triggers its tertiary check (`token ? <Layout/> : <Navigate to="/"/>`), executing an instantaneous transition to the login page without executing leftover error boundaries.

## 2. Basic Auth Fallback Implementations

**The Problem:**
Users were constantly hitting `401 Unauthorized` responses specifically originating inside `/api/v1/scrum/backlog/push`. Originally, the endpoint was programmed aggressively around Atlassian OAuth access tokens:
```javascript
// Legacy Code
const url = `https://api.atlassian.com/ex/jira/${user.cloudId}/rest/api/3/issue`;
```
OAuth tokens rotate rapidly. When they expired without the user performing a fresh Jira handshake, the backend forcibly responded with `401` to the frontend, which consequently tripped `handleAuthError`, forcing the user to log out of the ENTIRE web app inexplicably.

**The Solution:**
The code within `backlog.tool.js` (Agent Search) and `backlog.controller.js` (Push Endpoint) was rewritten to sever its dependency on fluctuating OAuth access credentials, replacing it with hardcoded Basic Authentication natively loaded from the `.env` configs.

```javascript
// backend/src/controllers/backlog.controller.js

export const pushBacklogItem = async (req, res) => {
  try {
    // 1. Initial configuration check
    if (!process.env.JIRA_HOST || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN) {
       return res.status(500).json({ error: "Jira Basic Auth credentials missing in .env" });
    }

    // 2. Encrypted auth payload generation
    const basicAuth = Buffer.from(
      `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN.replace(/"/g, '')}`
    ).toString('base64');

    // 3. Execution using standard Jira HTTP domains, abandoning 'ex/jira' OAuth subdomains
    const url = `${process.env.JIRA_HOST}/rest/api/3/issue`;
    const response = await axios.post(
      url,
      { fields: req.body.item },
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
```
**Outcome**: High reliability. The frontend web app sessions are now entirely uncoupled from Jira OAuth token expiry races. If the Jira Token inside `.env` itself is somehow manually revoked by an admin, the backend securely returns a `401` passing through `axios.post()`, hitting `handleAuthError()`, and securely executing a clean logout.
