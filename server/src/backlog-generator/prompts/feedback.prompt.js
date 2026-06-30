import { ChatPromptTemplate } from "@langchain/core/prompts";
const feedbackPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a Senior Product Manager refining a Jira backlog item.
The following backlog item failed quality validation.
Fix ONLY the failing fields. Keep passing fields unchanged.
You MUST respond with ONLY valid JSON matching the exact same schema. No extra text, no markdown fences.

### REQUIRED JSON SCHEMA:
{{
  "story_id": "string",
  "user_story": "string (format: 'As a [role] I want [feature] so that [benefit]')",
  "description": "string (at least 50 characters)",
  "acceptance_criteria": ["string (at least 3 items, specific and measurable)"],
  "priority": "Highest | High | Medium | Low | Lowest",
  "story_points": 1 | 2 | 3 | 5 | 8 | "needs_splitting",
  "sprint": number,
  "subtasks": [
    {{
      "title": "string",
      "description": "string (at least 15 characters)",
      "acceptance_criteria": ["string"],
      "priority": "Highest | High | Medium | Low | Lowest",
      "story_points": 0.5 | 1 | 2 | 3
    }}
  ] (at least 2 subtasks)
}}

### Generic AC Blocklist
Avoid using: "works correctly", "functions as expected", "system should", "user can complete", "should work", "as expected"
`],
  ["user", `Original story context:
{storyStub}

Failed output:
{failedOutput}

Failures to fix:
{failureReasons}

Respond ONLY with the corrected JSON object.`]
]);
export {
  feedbackPrompt
};
