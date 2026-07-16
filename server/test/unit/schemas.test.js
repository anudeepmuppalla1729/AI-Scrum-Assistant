import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PRDParserSchema, PushAISuggestionsBodySchema } from "../../src/utils/schemas.js";

describe("PRDParserSchema", () => {
  it("parses valid input with epics and issues", () => {
    const input = {
      epics: [
        {
          title: "Epic 1",
          issues: [
            { type: "Story", summary: "Login feature", description: "Allow users to login to the system securely" },
          ],
        },
      ],
    };
    const result = PRDParserSchema.parse(input);
    assert.equal(result.epics.length, 1);
    assert.equal(result.epics[0].title, "Epic 1");
  });

  it("parses empty object (both fields optional)", () => {
    const result = PRDParserSchema.parse({});
    assert.equal(result.epics, undefined);
    assert.equal(result.jira_issues, undefined);
  });

  it("parses with jira_issues only", () => {
    const input = {
      jira_issues: [
        { type: "Bug", summary: "Login broken on Safari browser", description: "Users on Safari cannot login due to cookie issue" },
      ],
    };
    const result = PRDParserSchema.parse(input);
    assert.equal(result.jira_issues.length, 1);
  });

  it("rejects invalid issue type", () => {
    const input = {
      jira_issues: [
        { type: "InvalidType", summary: "test", description: "test description" },
      ],
    };
    assert.throws(() => PRDParserSchema.parse(input));
  });
});

describe("PushAISuggestionsBodySchema", () => {
  it("parses valid input", () => {
    const input = {
      projectKey: "PROJ",
      suggestions: { data: { epics: [] } },
    };
    const result = PushAISuggestionsBodySchema.parse(input);
    assert.equal(result.projectKey, "PROJ");
  });

  it("rejects short projectKey", () => {
    const input = {
      projectKey: "P",
      suggestions: { data: { epics: [] } },
    };
    assert.throws(() => PushAISuggestionsBodySchema.parse(input));
  });

  it("rejects missing projectKey", () => {
    const input = {
      suggestions: { data: { epics: [] } },
    };
    assert.throws(() => PushAISuggestionsBodySchema.parse(input));
  });

  it("rejects missing suggestions", () => {
    const input = { projectKey: "PROJ" };
    assert.throws(() => PushAISuggestionsBodySchema.parse(input));
  });
});
