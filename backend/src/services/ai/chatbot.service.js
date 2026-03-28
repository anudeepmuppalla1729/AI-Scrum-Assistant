import agent from "./agent.service.js";

export const chatWithAI = async (
  userQuery,
  conversationHistory,
  sessionId = "1",
) => {
  try {
    // We already moved the system prompt into the `messageModifier` of the LangGraph agent wrapper.
    // This allows Gemini to correctly format the system instruction as the true top-level system message
    // and prevents the "System message should be the first one" array formatting error.

    const messages = [
      ...conversationHistory,
      { role: "user", content: userQuery },
    ];

    // Generate Response using LangGraph Tool Agent
    const response = await agent.invoke(
      { messages },
      // By removing checkpointer, we only rely on the explicit passed MongoDB history,
      // meaning thread_id doesn't dictate memory saving, it's virtually stateless,
      // preventing RAM leakage and surviving Node runtime restarts!
      { configurable: { thread_id: sessionId } },
    );

    const aiMessage = response.messages.at(-1);
    return aiMessage.content;
  } catch (error) {
    console.error("Error in chatWithAI:", error);
    throw new Error("Failed to process chat query.");
  }
};
