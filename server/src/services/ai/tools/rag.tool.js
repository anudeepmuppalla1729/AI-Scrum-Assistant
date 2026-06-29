import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { queryKnowledgeBase } from "../rag.service.js";

export const createRagSearchTool = (boardId = null) =>
  tool(
    async ({ query }) => {
      const results = await queryKnowledgeBase(query, 5, { boardId });
      return JSON.stringify(results);
    },
    {
      name: "scrum_knowledge_search",
      description:
        "Search project knowledge (PRDs, sprints, tickets) scoped to the active Jira board context.",
      schema: z.object({
        query: z
          .string()
          .describe(
            "A highly optimized search term to find relevant project data.",
          ),
      }),
    },
  );

export const ragSearchTool = createRagSearchTool();
