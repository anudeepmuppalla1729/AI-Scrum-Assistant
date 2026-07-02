import { runBacklogGenerator } from "../backlog-generator/index.js";
import { PushAISuggestionsBodySchema } from "../utils/schemas.js";
import { pushAISuggestionsHierarchy } from "../integrations/jira/services/transformers/hierarchy.service.js";
import { getJiraClient } from "../integrations/jira/services/jiraClient.js";
import { normalizeBoardId } from "../services/ai/rag.context.js";
import { extractTextFromPdfBuffer } from "../services/ai/prdToTickets.service.js";
import BusinessDocument from "../models/BusinessDocument.js";

import PRDSession from "../models/PRDSession.js";

export const generateSuggestions = async (req, res) => {
  try {
    if (!req.file && !req.body.prompt) {
      return res.status(400).json({ error: "No PRD file or prompt provided." });
    }

    const prdBuffer = req.file?.buffer;
    const projectKey = req.body.projectKey;
    const boardId = normalizeBoardId(req.body.boardId);
    let businessDocIds = [];
    const sessionId = req.body.sessionId;
    
    if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
    }
    
    try {
      if (req.body.businessDocIds) {
        businessDocIds = JSON.parse(req.body.businessDocIds);
      }
    } catch (e) {
      // ignore
    }

    const userId = req.user.userId || req.user._id;

    if (!projectKey) {
      return res.status(400).json({ error: "projectKey is required" });
    }

    let prdText = req.body.prompt || "";
    if (req.file) {
      if (req.file.originalname.toLowerCase().endsWith(".pdf")) {
        prdText = await extractTextFromPdfBuffer(prdBuffer);
      } else {
        prdText = prdBuffer.toString("utf-8");
      }
    }

    const businessDocs = await BusinessDocument.find({
      _id: { $in: businessDocIds },
      userId
    });
    
    const business_docs = businessDocs.map(doc => doc.content);

    // Update session to processing
    await PRDSession.findByIdAndUpdate(sessionId, { status: 'processing', error: null });

    // Run agent in background
    runBacklogGenerator({
      raw_prd: prdText,
      business_docs,
      boardId,
      projectKey,
      userId,
      sessionId
    }).then(async (result) => {
        const epicsMap = new Map();
        
        if (result.orchestrator_contract && result.orchestrator_contract.epics) {
            result.orchestrator_contract.epics.forEach(epic => {
                epicsMap.set(epic.id, {
                    id: epic.id,
                    title: epic.title,
                    description: epic.business_goal || "",
                    issues: []
                });
            });
        }
        
        if (result.written_stories) {
            result.written_stories.forEach(story => {
                const epic = epicsMap.get(story.epic_id);
                if (epic) {
                    epic.issues.push({
                        type: 'Story',
                        summary: story.user_story || "Untitled Story",
                        description: story.description || "",
                        acceptance_criteria: story.acceptance_criteria || [],
                        priority: story.priority || "P2",
                        story_points: story.story_points || 3,
                        sub_issues: (story.subtasks || []).map(st => ({
                            type: 'Task',
                            summary: st.title || "Subtask",
                            description: st.description || "",
                            acceptance_criteria: st.acceptance_criteria || [],
                            priority: st.priority || "P2"
                        }))
                    });
                }
            });
        }
        
        const finalEpics = Array.from(epicsMap.values());

        await PRDSession.findByIdAndUpdate(sessionId, { 
            status: 'ready', 
            epics: finalEpics,
            generatedBacklogId: result.backlog_id
        });
    }).catch(async (error) => {
        console.error("Background generator error:", error);
        await PRDSession.findByIdAndUpdate(sessionId, { 
            status: 'failed', 
            error: error.message || 'Failed to generate suggestions.' 
        });
    });

    return res.status(202).json({
      success: true,
      message: "Processing started in background.",
      status: "processing"
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to start generation.",
    });
  }
};

export const pushAISuggestionsToJira = async (req, res) => {
  try {
    const parsed = PushAISuggestionsBodySchema.parse(req.body);
    const { projectKey, suggestions } = parsed;

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const client = await getJiraClient(req.user);

    const result = await pushAISuggestionsHierarchy({
      client,
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
    
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const client = await getJiraClient(req.user);

    const report = await generateDailyStandup(client, projectKey);
    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSprintRetrospectiveReport = async (req, res) => {
  try {
    const { sprintId } = req.query;
    const boardId = normalizeBoardId(req.query?.boardId);
    if (!sprintId)
      return res.status(400).json({ error: "Sprint ID is required" });
    
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const client = await getJiraClient(req.user);

    const report = await generateSprintRetrospective(client, sprintId, boardId);
    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
