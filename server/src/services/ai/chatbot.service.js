import defaultAgent, { createConfiguredAgent } from "./agent.service.js";

export const chatWithAI = async (
  userQuery,
  conversationHistory,
  sessionId = "1",
  userId = null,
  options = {},
) => {
  try {
    const messages = [
      ...conversationHistory,
      { role: "user", content: userQuery },
    ];

    // Use user-configured agent (with backlog search) when userId is available,
    // otherwise fall back to default agent
    const agent = userId
      ? createConfiguredAgent(userId, options)
      : defaultAgent;

    const response = await agent.invoke(
      { messages },
      { configurable: { thread_id: sessionId } },
    );

    const aiMessage = response.messages.at(-1);
    
    // LangChain's Gemini bindings often return an array of content blocks instead of a single string.
    // We need to normalize it to a string for MongoDB to save it properly.
    let content = aiMessage.content;
    if (Array.isArray(content)) {
      content = content.map((block) => block.text || "").join("");
    }
    
    return content;
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    throw new Error("Failed to process chat query.");
  }
};
