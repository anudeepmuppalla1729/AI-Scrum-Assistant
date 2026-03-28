import { Version3Client } from "jira.js";
import "dotenv/config";

if (
  !process.env.JIRA_HOST ||
  !process.env.JIRA_EMAIL ||
  !process.env.JIRA_API_TOKEN
) {
  console.error(
    "JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN must be set in the .env file."
  );

}

export const jiraClient = new Version3Client({
  host: process.env.JIRA_HOST,
  authentication: {
    basic: {
      email: process.env.JIRA_EMAIL,
      apiToken: process.env.JIRA_API_TOKEN,
    },
  },
});

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

const getCreateMetaForProject = async (projectKey) => {
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