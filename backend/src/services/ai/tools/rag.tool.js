import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { queryKnowledgeBase } from "../rag.service.js";

export const ragSearchTool = tool(
  async ({ query }) => {
    const results = await queryKnowledgeBase(query, 5); // Fetch 5 chunks
    return JSON.stringify(results);
  },
  {
    name: "scrum_knowledge_search",
    description:
      "Search the project database for PRDs, Sprints, and Jira tickets. Call this when you need context about the user's project.",
    schema: z.object({
      query: z
        .string()
        .describe(
          "A highly optimized search term to find relevant project data.",
        ),
    }),
  },
);
