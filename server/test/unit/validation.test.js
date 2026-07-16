import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validationNode } from "../../src/backlog-generator/nodes/validation.js";

const makeValidStory = (overrides = {}) => ({
  story_id: "story-1",
  user_story: "As a user I want to login so that I can access my dashboard",
  description: "A".repeat(60),
  acceptance_criteria: ["AC1: User enters valid credentials", "AC2: System validates and redirects", "AC3: Dashboard loads within 2 seconds"],
  subtasks: [
    { title: "ST1", description: "Implement login form with email and password fields" },
    { title: "ST2", description: "Add authentication API endpoint with JWT" },
  ],
  validation_status: "passed",
  retry_count: 0,
  ...overrides,
});

describe("validationNode", () => {
  it("passes a valid story", async (t) => {
    const story = makeValidStory();
    const result = await validationNode({ current_batch: [story], written_stories: [] });
    const passed = result.written_stories.find(s => s.story_id === "story-1");
    assert.equal(passed.validation_status, "passed");
  });

  it("fails story with bad user_story format", async (t) => {
    const story = makeValidStory({ user_story: "do stuff" });
    const result = await validationNode({ current_batch: [story], written_stories: [] });
    const retryable = result.current_batch.items;
    assert.equal(retryable.length, 1);
    assert.ok(retryable[0].failure_reasons.some(r => r.includes("user_story")));
  });

  it("fails story with < 3 acceptance criteria", async (t) => {
    const story = makeValidStory({ acceptance_criteria: ["AC1", "AC2"] });
    const result = await validationNode({ current_batch: [story], written_stories: [] });
    const retryable = result.current_batch.items;
    assert.ok(retryable[0].failure_reasons.some(r => r.includes("acceptance_criteria")));
  });

  it("fails story with generic AC phrase", async (t) => {
    const story = makeValidStory({
      acceptance_criteria: ["AC1: Valid credentials", "AC2: works correctly", "AC3: Redirects to dashboard"],
    });
    const result = await validationNode({ current_batch: [story], written_stories: [] });
    const retryable = result.current_batch.items;
    assert.ok(retryable[0].failure_reasons.some(r => r.includes("generic phrase")));
  });

  it("fails story with < 2 subtasks", async (t) => {
    const story = makeValidStory({ subtasks: [{ title: "ST1", description: "Implement login form with email and password fields" }] });
    const result = await validationNode({ current_batch: [story], written_stories: [] });
    const retryable = result.current_batch.items;
    assert.ok(retryable[0].failure_reasons.some(r => r.includes("subtasks")));
  });

  it("fails story with short subtask description", async (t) => {
    const story = makeValidStory({
      subtasks: [
        { title: "ST1", description: "short" },
        { title: "ST2", description: "Implement authentication API endpoint with JWT" },
      ],
    });
    const result = await validationNode({ current_batch: [story], written_stories: [] });
    const retryable = result.current_batch.items;
    assert.ok(retryable[0].failure_reasons.some(r => r.includes("subtask 1 description")));
  });

  it("fails story with short description", async (t) => {
    const story = makeValidStory({ description: "too short" });
    const result = await validationNode({ current_batch: [story], written_stories: [] });
    const retryable = result.current_batch.items;
    assert.ok(retryable[0].failure_reasons.some(r => r.includes("description")));
  });

  it("passes through already-failed stories unchanged", async (t) => {
    const story = makeValidStory({ validation_status: "failed", failure_reasons: ["pre-existing"] });
    const result = await validationNode({ current_batch: [story], written_stories: [] });
    const retryable = result.current_batch.items;
    assert.equal(retryable.length, 1);
    assert.deepEqual(retryable[0].failure_reasons, ["pre-existing"]);
  });

  it("sends retryable failures to current_batch", async (t) => {
    const story = makeValidStory({ user_story: "bad format", retry_count: 0 });
    const result = await validationNode({ current_batch: [story], written_stories: [] });
    assert.equal(result.current_batch._replace, true);
    assert.equal(result.current_batch.items.length, 1);
    assert.equal(result.current_batch.items[0].retry_count, 0);
  });

  it("moves exhausted retries to written_stories", async (t) => {
    const story = makeValidStory({ user_story: "bad format", retry_count: 2 });
    const result = await validationNode({ current_batch: [story], written_stories: [] });
    assert.equal(result.current_batch.items.length, 0);
    assert.equal(result.written_stories.length, 1);
    assert.equal(result.written_stories[0].validation_status, "failed");
  });
});
