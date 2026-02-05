import agent from "./agent.service.js";
import { queryKnowledgeBase } from "./rag.service.js";

export const chatWithAI = async (userQuery, sessionId = "1") => {
  try {
    // 1. Retrieve RAG context
    const contextDocs = await queryKnowledgeBase(userQuery, 5);

    const contextText = contextDocs
      .map((doc) => `[${doc.metadata.type.toUpperCase()}] ${doc.content}`)
      .join("\n\n");

    // 2. Prompt
    const prompt = `
You are an AI Scrum Assistant.

Project context:
---
${contextText}
---

User: ${userQuery}

Rules:
- Answer only from context
- If missing info say: "I don't have enough information"
- Reply normally to greetings
- Be concise and helpful
`;

    // 3. Generate Response
    const response = await agent.invoke(
      { messages: [{ role: "user", content: prompt }] },
      { configurable: { thread_id: "1" } },
    );

    console.log(response.messages[1].content);
    return response.messages[1].content;
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    throw new Error("Failed to process chat query.");
  }
};
