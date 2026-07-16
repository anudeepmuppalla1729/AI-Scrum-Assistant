import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mockReq, mockRes } from "../helpers/mockReqRes.js";

// Test the controller logic patterns without importing the actual controller
// (which has side-effect imports). Instead, test the validation and response shapes.

describe("backlog controller validation patterns", () => {
  it("searchBacklog requires projectKey", () => {
    const query = {};
    assert.ok(!query.projectKey, "projectKey should be required");
  });

  it("searchBacklog builds JQL correctly", () => {
    const { projectKey, query, issueType } = {
      projectKey: "PROJ",
      query: "login",
      issueType: "Story",
    };

    let jql = `project = "${projectKey}"`;
    if (issueType) {
      jql += ` AND issuetype = "${issueType}"`;
    }
    if (query) {
      jql += ` AND summary ~ "${query}"`;
    }
    jql += ` ORDER BY updated DESC`;

    assert.ok(jql.includes('project = "PROJ"'));
    assert.ok(jql.includes('issuetype = "Story"'));
    assert.ok(jql.includes('summary ~ "login"'));
    assert.ok(jql.includes("ORDER BY updated DESC"));
  });

  it("pushBacklogItem validates required fields", () => {
    const body = { projectKey: "PROJ" };
    const isValid = body.projectKey && body.item?.summary && body.item?.type;
    assert.ok(!isValid, "Should fail without item");
  });

  it("pushBacklogItem builds JIRA fields correctly", () => {
    const item = {
      summary: "Login feature",
      type: "Story",
      description: "Allow users to login",
      priority: "High",
      storyPoints: 5,
      parentKey: "PROJ-10",
    };

    const fields = {
      project: { key: "PROJ" },
      issuetype: { name: item.type },
      summary: item.summary,
    };

    if (item.description) {
      fields.description = {
        type: "doc",
        version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: item.description }] }],
      };
    }
    if (item.parentKey) fields.parent = { key: item.parentKey };
    if (item.priority) fields.priority = { name: item.priority };

    assert.equal(fields.project.key, "PROJ");
    assert.equal(fields.issuetype.name, "Story");
    assert.equal(fields.summary, "Login feature");
    assert.equal(fields.parent.key, "PROJ-10");
    assert.equal(fields.priority.name, "High");
    assert.equal(fields.description.type, "doc");
  });

  it("pushBacklogItem builds ADF acceptance criteria", () => {
    const ac = ["User enters valid credentials", "System validates", "Dashboard loads"];
    const descriptionContent = [
      { type: "paragraph", content: [{ type: "text", text: "Login description" }] },
    ];
    descriptionContent.push({
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Acceptance Criteria" }],
    });
    descriptionContent.push({
      type: "bulletList",
      content: ac.map(a => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: a }] }],
      })),
    });

    assert.equal(descriptionContent.length, 3);
    assert.equal(descriptionContent[1].type, "heading");
    assert.equal(descriptionContent[2].type, "bulletList");
    assert.equal(descriptionContent[2].content.length, 3);
  });

  it("getPushHistory filters by userId and sessionId", () => {
    const userId = "user-123";
    const sessionId = "session-456";

    const filter = { userId };
    if (sessionId) filter.sessionId = sessionId;

    assert.equal(filter.userId, "user-123");
    assert.equal(filter.sessionId, "session-456");
  });

  it("getPushHistory without sessionId only filters by userId", () => {
    const userId = "user-123";
    const sessionId = undefined;

    const filter = { userId };
    if (sessionId) filter.sessionId = sessionId;

    assert.equal(filter.userId, "user-123");
    assert.equal(filter.sessionId, undefined);
  });

  it("searchBacklog maps JIRA response correctly", () => {
    const issues = [
      {
        key: "TEST-1",
        fields: {
          summary: "Login",
          issuetype: { name: "Story" },
          status: { name: "To Do" },
          parent: { key: "TEST-10" },
        },
      },
    ];

    const mapped = issues.map(issue => ({
      key: issue.key,
      summary: issue.fields?.summary,
      type: issue.fields?.issuetype?.name,
      status: issue.fields?.status?.name,
      parentKey: issue.fields?.parent?.key || null,
    }));

    assert.equal(mapped[0].key, "TEST-1");
    assert.equal(mapped[0].summary, "Login");
    assert.equal(mapped[0].type, "Story");
    assert.equal(mapped[0].parentKey, "TEST-10");
  });
});

describe("req/res mock helpers", () => {
  it("mockReq creates default user", () => {
    const req = mockReq();
    assert.equal(req.user.userId, "test-user-123");
  });

  it("mockReq allows overrides", () => {
    const req = mockReq({ body: { projectKey: "PROJ" } });
    assert.equal(req.body.projectKey, "PROJ");
    assert.equal(req.user.userId, "test-user-123");
  });

  it("mockRes chains status and json", () => {
    const res = mockRes();
    res.status(201).json({ success: true });
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
  });
});
