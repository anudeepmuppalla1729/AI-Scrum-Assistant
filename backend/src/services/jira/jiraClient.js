import { Version3Client } from "jira.js";
import axios from "axios";
import "dotenv/config";
import User from "../../models/User.js";
import "dotenv/config";

/**
 * Ensures the user's Jira OAuth token is valid, refreshing it if necessary.
 * @param {object} user - The mongoose User document.
 */
const ensureValidJiraToken = async (userObject) => {
  let user = userObject;
  
  if (user && user.userId && !user.jiraTokens) {
    user = await User.findById(user.userId);
  }

  if (!user || (!user.jiraTokens?.accessToken)) {
    throw new Error("User does not have connected Jira credentials. Please authenticate with Jira.");
  }
  
  if (!user.cloudId) {
    throw new Error("User does not have a connected Jira cloud site. Please log out and back in with Atlassian.");
  }

  // Add 5 minutes buffer to expiration check
  if (Date.now() + 5 * 60 * 1000 >= new Date(user.jiraTokens.expiresAt).getTime()) {
    try {
      const response = await axios.post("https://auth.atlassian.com/oauth/token", {
        grant_type: "refresh_token",
        client_id: process.env.ATLASSIAN_CLIENT_ID,
        client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
        refresh_token: user.jiraTokens.refreshToken
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      // Update tokens in memory
      user.jiraTokens.accessToken = access_token;
      user.jiraTokens.refreshToken = refresh_token;
      user.jiraTokens.expiresAt = new Date(Date.now() + expires_in * 1000);
      
      // Save to database
      if (typeof user.save === 'function') {
         await user.save();
      }
    } catch (err) {
      console.error("Failed to refresh Jira token", err.response?.data || err.message);
      throw new Error("Failed to refresh Jira authentication. Please reconnect your account.");
    }
  }
}

/**
 * Initializes and returns a Version3Client for a specific user safely.
 */
export const getJiraClient = async (userObject) => {
  let user = userObject;
  if (user && user.userId && !user.jiraTokens) {
    user = await User.findById(user.userId);
  }

  await ensureValidJiraToken(user);
  
  const client = new Version3Client({
    host: `https://api.atlassian.com/ex/jira/${user.cloudId}`,
    authentication: {
      oauth2: {
        accessToken: user.jiraTokens.accessToken
      }
    }
  });

  // Attach cloudId for caching purposes later
  client._cloudId = user.cloudId;
  return client;
};


export const createIssueWithRetry = async (client, issuePayload, options = {}) => {
  const { retries = 3, baseDelayMs = 500, onRetry } = options;
  let attempt = 0;
  let lastErr;

  while (attempt <= retries) {
    try {
      return await client.issues.createIssue(issuePayload);
    } catch (err) {
      const status = err?.response?.status || err?.status;
      const isRetryable = status === 429 || (status >= 500 && status < 600);

      if (!isRetryable || attempt === retries) {
        throw err; // bubble original Jira error
      }

      const retryAfterHeader =
        err?.response?.headers?.["retry-after"] ||
        err?.response?.headers?.["Retry-After"];
      const retryAfterMs = retryAfterHeader
        ? Number(retryAfterHeader) * 1000
        : null;

      const delay =
        retryAfterMs !== null
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

const _createMetaCache = new Map();

const getCreateMetaForProject = async (client, projectKey) => {
  // Prevent multitenant caching collisions
  const cacheKey = `${client._cloudId}-${projectKey}`;
  if (_createMetaCache.has(cacheKey)) return _createMetaCache.get(cacheKey);

  const resp = await client.issueCreateMetadata.getCreateIssueMeta({
    projectKeys: [projectKey],
    expand: ["projects.issuetypes.fields"],
  });

  const meta = resp?.projects?.[0] || null;
  _createMetaCache.set(cacheKey, meta);
  return meta;
};

export const resolveIssueTypeId = async (client, projectKey, predicate) => {
  const meta = await getCreateMetaForProject(client, projectKey);
  const types = meta?.issuetypes || [];
  const match = types.find(predicate);
  return match?.id || null;
};