import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createMockJiraClient, createFailingMockClient } from "../helpers/mockJiraClient.js";

// Import the functions we want to test
// We test searchIssues and createIssue by calling them with mock clients
import {
  searchIssues,
  createIssue,
  createIssueWithRetry,
  resolveIssueTypeId,
} from "../../src/integrations/jira/services/jiraClient.js";

describe("searchIssues", () => {
  it("returns issues and total from mock client", async () => {
    const client = createMockJiraClient();
    const result = await searchIssues(client, {
      jql: 'project = "TEST"',
      maxResults: 10,
    });
    assert.ok(Array.isArray(result.issues));
    assert.ok(typeof result.total === "number");
  });

  it("returns empty results gracefully", async () => {
    const client = createMockJiraClient({
      issueSearch: {
        searchForIssuesUsingJqlPost: async () => ({ issues: [], total: 0 }),
      },
    });
    const result = await searchIssues(client, { jql: 'project = "EMPTY"' });
    assert.equal(result.issues.length, 0);
    assert.equal(result.total, 0);
  });

  it("passes parameters correctly", async () => {
    let capturedParams;
    const client = createMockJiraClient({
      issueSearch: {
        searchForIssuesUsingJqlPost: async (params) => {
          capturedParams = params;
          return { issues: [], total: 0 };
        },
      },
    });
    await searchIssues(client, {
      jql: 'project = "TEST" AND type = Bug',
      maxResults: 50,
      fields: ["summary", "status"],
    });
    assert.equal(capturedParams.jql, 'project = "TEST" AND type = Bug');
    assert.equal(capturedParams.maxResults, 50);
    assert.deepEqual(capturedParams.fields, ["summary", "status"]);
  });
});

describe("createIssueWithRetry", () => {
  it("succeeds on first attempt", async () => {
    const client = createMockJiraClient();
    const result = await createIssueWithRetry(client, {
      fields: { summary: "Test" },
    });
    assert.ok(result.id);
    assert.ok(result.key);
  });

  it("retries on 429 and succeeds", async () => {
    let attempts = 0;
    const client = createMockJiraClient({
      issues: {
        createIssue: async () => {
          attempts++;
          if (attempts === 1) {
            const err = new Error("Rate limited");
            err.response = { status: 429, headers: {} };
            err.status = 429;
            throw err;
          }
          return { id: "10001", key: "TEST-1" };
        },
      },
    });
    const result = await createIssueWithRetry(client, { fields: { summary: "Test" } }, { baseDelayMs: 10 });
    assert.equal(result.key, "TEST-1");
    assert.equal(attempts, 2);
  });

  it("retries on 500 and succeeds", async () => {
    let attempts = 0;
    const client = createMockJiraClient({
      issues: {
        createIssue: async () => {
          attempts++;
          if (attempts <= 2) {
            const err = new Error("Server error");
            err.response = { status: 500, headers: {} };
            err.status = 500;
            throw err;
          }
          return { id: "10001", key: "TEST-1" };
        },
      },
    });
    const result = await createIssueWithRetry(client, { fields: { summary: "Test" } }, { baseDelayMs: 10 });
    assert.equal(result.key, "TEST-1");
    assert.equal(attempts, 3);
  });

  it("does not retry on 400", async () => {
    let attempts = 0;
    const client = createMockJiraClient({
      issues: {
        createIssue: async () => {
          attempts++;
          const err = new Error("Bad request");
          err.response = { status: 400, headers: {} };
          err.status = 400;
          throw err;
        },
      },
    });
    await assert.rejects(
      () => createIssueWithRetry(client, { fields: { summary: "Test" } }, { baseDelayMs: 10 }),
      { message: "Bad request" }
    );
    assert.equal(attempts, 1);
  });

  it("throws after exhausting retries", async () => {
    let attempts = 0;
    const client = createMockJiraClient({
      issues: {
        createIssue: async () => {
          attempts++;
          const err = new Error("Rate limited");
          err.response = { status: 429, headers: {} };
          err.status = 429;
          throw err;
        },
      },
    });
    await assert.rejects(
      () => createIssueWithRetry(client, { fields: { summary: "Test" } }, { retries: 2, baseDelayMs: 10 })
    );
    assert.equal(attempts, 3); // initial + 2 retries
  });
});

describe("resolveIssueTypeId", () => {
  it("resolves issue type by predicate", async () => {
    const client = createMockJiraClient();
    const typeId = await resolveIssueTypeId(client, "TEST", (t) => t.name === "Story");
    assert.equal(typeId, "10002");
  });

  it("returns null when no match", async () => {
    const client = createMockJiraClient();
    const typeId = await resolveIssueTypeId(client, "TEST", (t) => t.name === "NonExistent");
    assert.equal(typeId, null);
  });

  it("resolves subtask type", async () => {
    const client = createMockJiraClient();
    const typeId = await resolveIssueTypeId(client, "TEST", (t) => t.subtask === true);
    assert.equal(typeId, "10003");
  });
});
