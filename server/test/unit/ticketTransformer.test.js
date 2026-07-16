import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  toEpicCreatePayload,
  toStoryCreatePayload,
  toSubtaskCreatePayload,
} from "../../src/integrations/jira/services/transformers/ticketTransformer.service.js";

describe("toEpicCreatePayload", () => {
  it("creates basic epic payload", () => {
    const result = toEpicCreatePayload({
      projectKey: "PROJ",
      epic: { title: "Epic 1" },
    });
    assert.equal(result.fields.project.key, "PROJ");
    assert.equal(result.fields.issuetype.name, "Epic");
    assert.equal(result.fields.summary, "Epic 1");
  });

  it("includes ADF description when provided", () => {
    const result = toEpicCreatePayload({
      projectKey: "PROJ",
      epic: { title: "Epic 1", description: "Epic description" },
    });
    assert.ok(result.fields.description);
    assert.equal(result.fields.description.type, "doc");
    assert.equal(result.fields.description.version, 1);
    assert.equal(result.fields.description.content[0].content[0].text, "Epic description");
  });

  it("omits description when not provided", () => {
    const result = toEpicCreatePayload({
      projectKey: "PROJ",
      epic: { title: "Epic 1" },
    });
    assert.equal(result.fields.description, undefined);
  });
});

describe("toStoryCreatePayload", () => {
  it("creates basic story payload", () => {
    const result = toStoryCreatePayload({
      projectKey: "PROJ",
      story: { summary: "Story 1", description: "Story description" },
      epicId: "100",
    });
    assert.equal(result.fields.project.key, "PROJ");
    assert.equal(result.fields.issuetype.name, "Story");
    assert.equal(result.fields.parent.id, "100");
    assert.equal(result.fields.summary, "Story 1");
  });

  it("includes priority when provided", () => {
    const result = toStoryCreatePayload({
      projectKey: "PROJ",
      story: { summary: "S1", description: "d", priority: "High" },
      epicId: "100",
    });
    assert.equal(result.fields.priority.name, "High");
  });

  it("omits priority when not provided", () => {
    const result = toStoryCreatePayload({
      projectKey: "PROJ",
      story: { summary: "S1", description: "d" },
      epicId: "100",
    });
    assert.equal(result.fields.priority, undefined);
  });

  it("includes acceptance criteria in ADF description", () => {
    const result = toStoryCreatePayload({
      projectKey: "PROJ",
      story: {
        summary: "S1",
        description: "d",
        acceptance_criteria: ["AC1", "AC2"],
      },
      epicId: "100",
    });
    const desc = result.fields.description;
    assert.ok(desc.content.some(c => c.type === "bulletList"));
  });
});

describe("toSubtaskCreatePayload", () => {
  it("creates basic subtask payload", () => {
    const result = toSubtaskCreatePayload({
      projectKey: "PROJ",
      subtask: { summary: "Subtask 1", description: "Subtask description" },
      storyId: "200",
    });
    assert.equal(result.fields.parent.id, "200");
    assert.equal(result.fields.summary, "Subtask 1");
  });

  it("uses issueTypeId when provided", () => {
    const result = toSubtaskCreatePayload({
      projectKey: "PROJ",
      subtask: { summary: "ST", description: "d" },
      storyId: "200",
      issueTypeId: "10003",
    });
    assert.equal(result.fields.issuetype.id, "10003");
  });

  it("falls back to 'Subtask' name when no issueTypeId", () => {
    const result = toSubtaskCreatePayload({
      projectKey: "PROJ",
      subtask: { summary: "ST", description: "d" },
      storyId: "200",
    });
    assert.equal(result.fields.issuetype.name, "Subtask");
  });

  it("includes priority when provided", () => {
    const result = toSubtaskCreatePayload({
      projectKey: "PROJ",
      subtask: { summary: "ST", description: "d", priority: "Low" },
      storyId: "200",
    });
    assert.equal(result.fields.priority.name, "Low");
  });
});
