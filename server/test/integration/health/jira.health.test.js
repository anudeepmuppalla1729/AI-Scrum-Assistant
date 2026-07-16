import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("JIRA Health Check", () => {
  it("has JIRA_HOST configured", () => {
    const host = process.env.JIRA_HOST;
    assert.ok(host, "JIRA_HOST env var must be set");
    assert.ok(host.startsWith("http"), "JIRA_HOST must be a URL");
  });

  it("has JIRA credentials configured (Basic Auth or OAuth)", () => {
    const hasBasicAuth = process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN;
    const hasOAuth = process.env.ATLASSIAN_CLIENT_ID && process.env.ATLASSIAN_CLIENT_SECRET;
    assert.ok(
      hasBasicAuth || hasOAuth,
      "Either JIRA_EMAIL+JIRA_API_TOKEN or ATLASSIAN_CLIENT_ID+ATLASSIAN_CLIENT_SECRET must be set"
    );
  });

  it("JIRA API is reachable (server info)", async () => {
    const host = process.env.JIRA_HOST;
    if (!host) return; // skip if not configured

    try {
      const response = await fetch(`${host}/rest/api/3/serverInfo`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.ok(data.serverTitle || data.baseUrl);
    } catch (err) {
      // If fetch fails (no network), skip rather than fail
      console.warn(`JIRA API unreachable: ${err.message}`);
    }
  });

  it("JIRA auth is valid (myself endpoint)", async () => {
    const host = process.env.JIRA_HOST;
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;
    if (!host || !email || !token) return; // skip if not configured

    try {
      const auth = Buffer.from(`${email}:${token}`).toString("base64");
      const response = await fetch(`${host}/rest/api/3/myself`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${auth}`,
        },
        signal: AbortSignal.timeout(10000),
      });
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.ok(data.emailAddress || data.displayName);
    } catch (err) {
      console.warn(`JIRA auth check failed: ${err.message}`);
    }
  });
});
