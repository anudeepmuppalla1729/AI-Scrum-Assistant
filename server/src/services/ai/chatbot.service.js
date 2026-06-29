import { compileAgent } from "./agent.service.js";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import mongoose from "mongoose";

export const chatWithAI = async (
  userQuery,
  conversationHistory,
  sessionId = "1",
  userId = null,
  options = {},
) => {
  try {
    const client = mongoose.connection.getClient();
    const dbName = process.env.DB_NAME || "jira_app";
    const checkpointer = new MongoDBSaver({ client, dbName });
    
    const agent = compileAgent(userId, options, checkpointer);
    
    // Check if the graph has state for this thread
    const config = { configurable: { thread_id: sessionId } };
    const state = await agent.getState(config);
    
    let messages = [];
    if (!state?.values?.messages?.length) {
      // If no messages exist in the checkpointer, seed with history
      messages = [
        ...conversationHistory,
        { role: "user", content: userQuery },
      ];
    } else {
      // If checkpointer has history, just pass the new message
      messages = [
        { role: "user", content: userQuery },
      ];
    }

    const response = await agent.invoke(
      { messages },
      config,
    );

    const aiMessage = response.messages.at(-1);
    
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
