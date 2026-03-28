# Atlassian Jira OAuth 2.0 (3LO) Architecture

Jira's authentication architecture is notoriously complex and strict. Unlike traditional systems that tie an API token directly to a single tenant URL (`https://your-domain.atlassian.net`), Atlassian's modern **OAuth 2.0 (3LO)** treats your application as an independent entity attempting to gain granular access into a user's *cloud instances*.

This document details exactly how the 3-Legged OAuth (3LO) flow works in this application and why it can be one of the "worst" or most frustrating systems to implement.

## The 5-Step OAuth Flow

### Step 1: Requesting Authorization
The user is redirected from the frontend to Atlassian's central auth server. This is not tied to their specific Jira board URL.
```http
GET https://auth.atlassian.com/authorize
  ?audience=api.atlassian.com
  &client_id=<YOUR_ATLASSIAN_CLIENT_ID>
  &scope=read:jira-work write:jira-work read:jira-user
  &redirect_uri=http://localhost:5173/oauth/callback
  &response_type=code
  &prompt=consent
```
*Atlassian strictly checks the `scope` strings. If your app attempts to hit an endpoint that requires a scope you didn't define here, you get a 401.*

### Step 2: User Grants Consent
The user logs in manually to Atlassian and clicks "Accept". Atlassian then redirects the browser back to our frontend callback URL with an authorization code.
```
http://localhost:5173/oauth/callback?code=XyZ123ABC
```

### Step 3: Exchanging Code for Tokens
The backend (`/api/v1/auth/jira/callback`) takes that short-lived `code` and exchanges it behind the scenes for an **Access Token** and a **Refresh Token**.
```http
POST https://auth.atlassian.com/oauth/token
{
  "grant_type": "authorization_code",
  "client_id": "...",
  "client_secret": "...",
  "code": "XyZ123ABC",
  "redirect_uri": "..."
}
```

### Step 4: The Cloud ID Discovery (The Quirky Part)
Unlike GitHub or Google where an `access_token` is universally applicable, Atlassian users can be members of *multiple distinct Jira workspaces*. The `access_token` does not inherently know which workspace you are trying to query.

Before making our first real API call, the backend MUST query the **Accessible Resources API**:
```http
GET https://api.atlassian.com/oauth/token/accessible-resources
Authorization: Bearer <ACCESS_TOKEN>
```
**Response:**
```json
[
  {
    "id": "1324a887-45db-1bf4-1e99-ef0ff456d421", 
    "url": "https://your-domain.atlassian.net",
    "name": "your-domain",
    "scopes": ["read:jira-work", "write:jira-work"]
  }
]
```
The application extracts the `id` (this is called the **Cloud ID**).

### Step 5: Making API Calls
With the Cloud ID, instead of querying `https://your-domain.atlassian.net/rest/api/3/...`, OAuth Apps MUST use Atlassian's global proxy using the `Cloud ID`.
```http
GET https://api.atlassian.com/ex/jira/<CLOUD_ID>/rest/api/3/search/jql
Authorization: Bearer <ACCESS_TOKEN>
```

---

## Why Jira OAuth is Considered Frustrating (The "Worst" Parts)

1. **Ultra-Short Access Tokens**: Atlassian OAuth Access Tokens expire incredibly fast (usually 15-60 minutes). If you do not actively build a highly reliable background Refresh Token cycle, your users will be constantly kicked out with `401 Unauthorized` errors.
2. **Rotating Refresh Tokens**: When you use a Refresh Token to get a new Access Token, Atlassian revokes the old Refresh Token and issues a new one. If your database fails to save the new Refresh Token, the user's entire OAuth connection is permanently severed ("burnt").
3. **The `Cloud ID` Proxy Pattern**: Needing to prepend `/ex/jira/{cloudId}/` to every standard API URL creates massive divergence from Atlassian's own documentation, which usually assumes you are writing Basic Auth scripts hitting your native subdomain.
4. **Scope Nightmares**: Certain APIs require esoteric scopes (e.g., `manage:jira-project`). If an OAuth app upgrades to include a new scope, all previous users must re-authorize to gain access to the feature.
