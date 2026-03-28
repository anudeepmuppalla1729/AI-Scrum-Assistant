# AI Agent & Langchain Tooling

This document rigorously maps the AI intelligence tier, explaining the LangGraph setups, the Gemini SDK edge cases, and the exact code implementations for the Agent Tools.

## 1. Agent Creation

Instead of basic linear chains, the system leverages `@langchain/langgraph/prebuilt`'s `createReactAgent`. This framework creates a dynamic execution loop where the LLM can decide to use a tool, read its structured output, and then seamlessly continue generating its response.

```javascript
// backend/src/services/ai/agent.service.js
import { createReactAgent } from "@langchain/langgraph/prebuilt";

export const createConfiguredAgent = (userId) => {
  const backlogSearchTool = createBacklogSearchTool(userId);
  return createReactAgent({
    llm: model,
    tools: [ragSearchTool, backlogSearchTool],
    messageModifier: systemPrompt,
  });
};
```
- `messageModifier`: Injects the massive system prompt at the beginning of the context window.
- `tools`: An array of Zod-validated Javascript functions the model can choose to execute.

## 2. Gemini Parse Formatting

Google's Gemini model wrapped within Langchain JS has a volatile behavior mapping: it often outputs an internal Array format representing chunks instead of standard markdown Strings when complex tools are involved. 

We forcefully serialize this at the exit point in `chatbot.service.js` before MongoDB attempts to natively save it into the `ChatMessage.content` string field:

```javascript
const aiMessage = response.messages.at(-1);

// Coerce the output blocks into normalized Text
let content = aiMessage.content;
if (Array.isArray(content)) {
  content = content.map((block) => block.text || "").join("");
}
return content; // Mongoose will no longer throw a CastError (Array to String representation failure)
```

## 3. The `jira_backlog_search` Tool

**Purpose**: Gives the AI direct sight into the current Jira board state. If a user asks "Add a login task", the AI automatically searches "Login" to see what Epic or Story it belongs under, minimizing duplicate epics.

**Code implementation**:
```javascript
// backend/src/services/ai/tools/backlog.tool.js
export const createBacklogSearchTool = (userId) => {
  return tool(
    async ({ projectKey, searchText, issueType }) => {
      // Basic Auth transformation using .env Fallback mechanism
      const basicAuth = Buffer.from(
        `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN.replace(/"/g, '')}`
      ).toString('base64');

      // Native JQL builder dynamically adjusting to AI constraints
      let jql = `project = "${projectKey}"`;
      if (issueType) jql += ` AND issuetype = "${issueType}"`;
      else jql += ` AND issuetype in ("Epic", "Story", "Task")`;

      if (searchText) { // The AI escapes search terms nicely
        jql += ` AND (summary ~ "\\"${searchText}\\"" OR description ~ "\\"${searchText}\\"")`;
      }
      jql += ` ORDER BY updated DESC`;

      const url = `${process.env.JIRA_HOST}/rest/api/3/search/jql`;
      // Execute Axios Request and slice the fields safely for token optimization
      ...
    },
    {
      name: "jira_backlog_search",
      description: "Search the user's Jira project for existing Epics, Stories, and Tasks...",
      schema: z.object({
        projectKey: z.string().describe("The Jira project key (e.g., 'SCRUM')"),
        searchText: z.string().optional().describe("Text to search Jira summaries"),
        issueType: z.enum(["Epic", "Story", "Task", "Bug"]).optional()
      })
    }
  );
};
```

## 4. The `ragSearchTool` (Knowledge Base Search)

**Purpose**: Retrieves deep project documentation like Sprint Plans, uploaded PRDs (Product Requirement Documents), or historical wiki data stored inside the local ChromaDB vector database.

**Code Implementation**:
```javascript
// backend/src/services/ai/tools/rag.tool.js
export const ragSearchTool = tool(
  async ({ query }) => {
    // Queries initialized chromaDB client taking the top 5 chunks via cosine similarity
    const results = await queryKnowledgeBase(query, 5);
    return JSON.stringify(results);
  },
  {
    name: "scrum_knowledge_search",
    description: "Search the project database for PRDs, Sprints, and Jira tickets.",
    schema: z.object({
      query: z.string().describe("A highly optimized search term to find relevant project data.")
    }),
  }
);
```

## 5. System Prompt Guidelines

The `messageModifier` string fundamentally alters the AI's identity. 
1. **Rule of Affirmation**: The LLM is strictly warned: *"DO NOT HALLUCINATE that you cannot push to Jira. The frontend handles the API. Affirm to the user you can."*
2. **Schema Enforcement**: It forces strict JSON syntax inside Markdown wrappers (` ```backlog-json ... ``` `). It guarantees `type`, `summary`, `description`, `acceptanceCriteria` (string array), and `priority` exist.
3. **Implicit Tooling**: When requested to build an Epic, if the AI detects vagueness, it is instructed to pause, call `scrum_knowledge_search` against the vector DB, and append that knowledge natively into real acceptance criteria without the user having to supply documentation manually.
