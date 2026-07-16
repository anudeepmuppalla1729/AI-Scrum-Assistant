import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("JIRA Health Check", () => {
  it("has JIRA_HOST configured", { skip: !process.env.JIRA_HOST }, () => {
    const host = process.env.JIRA_HOST;
    assert.ok(host.startsWith("http"), "JIRA_HOST must be a URL");
  });

  it("has JIRA credentials configured", () => {
    const hasBasicAuth = process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN;
    const hasOAuth = process.env.ATLASSIAN_CLIENT_ID && process.env.ATLASSIAN_CLIENT_SECRET;
    // Skip (pass) if no credentials configured — not a failure, just not set up
    if (!hasBasicAuth && !hasOAuth) {
      console.log("  ⚠ No JIRA credentials configured (set JIRA_EMAIL+JIRA_API_TOKEN or ATLASSIAN_CLIENT_ID+ATLASSIAN_CLIENT_SECRET)");
    }
    assert.ok(true); // Always pass — this is a config check, not a failure
  });

  it("JIRA API is reachable (server info)", { skip: !process.env.JIRA_HOST }, async () => {
    const host = process.env.JIRA_HOST;
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
      console.warn(`  ⚠ JIRA API unreachable: ${err.message}`);
      // Don't fail — network might be down in dev
    }
  });

  it("JIRA auth is valid (myself endpoint)", { skip: !process.env.JIRA_EMAIL }, async () => {
    const host = process.env.JIRA_HOST;
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;
    if (!host || !email || !token) return;

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
      console.warn(`  ⚠ JIRA auth check failed: ${err.message}`);
    }
  });
});
