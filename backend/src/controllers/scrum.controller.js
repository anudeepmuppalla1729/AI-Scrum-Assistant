import { getSuggestionsFromPRD } from "../services/ai/prdToTickets.service.js";
import { PushAISuggestionsBodySchema } from "../utils/schemas.js";
import { pushAISuggestionsHierarchy } from "../services/jira/transformers/hierarchy.service.js";
import { chatWithAI } from "../services/ai/chatbot.service.js";

export const generateSuggestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PRD file uploaded." });
    }

    const prdBuffer = req.file.buffer;
    const userPrompt = req.body.userPrompt || "";
    const filename = req.file.originalname;
    const aiSuggestions = await getSuggestionsFromPRD(
      prdBuffer,
      userPrompt,
      filename
    );

    return res.status(200).json({
      success: true,
      message: "AI-generated suggestions retrieved successfully.",
      data: aiSuggestions,
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate suggestions.",
    });
  }
};

export const pushAISuggestionsToJira = async (req, res) => {
  try {
    const parsed = PushAISuggestionsBodySchema.parse(req.body);
    const { projectKey, suggestions } = parsed;

    const result = await pushAISuggestionsHierarchy({
      projectKey,
      suggestions,
    });

    return res.status(200).json({
      success: result.success,
      created: result.created,
      errors: result.errors,
    });
  } catch (error) {
    const zodIssues = error?.issues || error?.errors;
    if (zodIssues) {
      console.error("Validation Error:", JSON.stringify(zodIssues, null, 2));
      return res.status(400).json({
        success: false,
        error: "Invalid request body",
        details: zodIssues,
      });
    }
    console.error("Error pushing AI suggestions to Jira:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to push AI suggestions to Jira.",
    });
  }
};

import ChatSession from "../models/ChatSession.js";

export const chatWithScrumMaster = async (req, res) => {
  try {
    const { message } = req.body;
    // Assuming user is authenticated and req.user exists (set by auth middleware)
    // If not, we might need to handle anonymous or pass userId in body, but let's assume req.user._id
    const userId = req.user?._id;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const answer = await chatWithAI(message);

    // Save to DB if user is authenticated
    if (userId) {
      // Find latest session or create new (simplified: single session per user for now, or just append)
      // For this feature, let's keep it simple: one massive chat log per user or a daily session?
      // Let's do: Find a session for today, or just one single session for now.
      // Better: Just one session document for the "Main Chat".

      let session = await ChatSession.findOne({ userId });
      if (!session) {
        session = new ChatSession({ userId, messages: [] });
      }

      session.messages.push({ role: "user", content: message });
      session.messages.push({ role: "assistant", content: answer });
      await session.save();
    }

    return res.status(200).json({
      reply: answer,
      intent: "chat", // Default intent for now
      issues: [],
    });
  } catch (error) {
    console.error("Error in chatWithScrumMaster:", error);
    return res.status(500).json({
      error: "Failed to process chat query.",
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const session = await ChatSession.findOne({ userId });
    return res.status(200).json({
      history: session ? session.messages : [],
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({ error: "Failed to fetch chat history" });
  }
};

import {
  generateDailyStandup,
  generateSprintRetrospective,
} from "../services/automation/automation.service.js";

export const getDailyStandupReport = async (req, res) => {
  try {
    const { projectKey } = req.query;
    if (!projectKey)
      return res.status(400).json({ error: "Project key is required" });
    const report = await generateDailyStandup(projectKey);
    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSprintRetrospectiveReport = async (req, res) => {
  try {
    const { sprintId } = req.query;
    if (!sprintId)
      return res.status(400).json({ error: "Sprint ID is required" });
    const report = await generateSprintRetrospective(sprintId);
    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
