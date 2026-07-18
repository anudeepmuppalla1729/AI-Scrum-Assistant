import { runBacklogGenerator } from "../backlog-generator/index.js";
import { normalizeBoardId } from "../services/ai/rag.context.js";
import { extractTextFromPdfBuffer } from "../services/ai/prdToTickets.service.js";
import BusinessDocument from "../models/BusinessDocument.js";
import PRDSession from "../models/PRDSession.js";

/**
 * Generate backlog suggestions from a PRD (PDF or text prompt).
 * Kicks off the LangGraph pipeline in the background and returns 202 immediately.
 */
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

    const userId = req.user?.userId || req.user?._id || null;

    // projectKey required for logged-in users, optional for anonymous
    if (!projectKey && userId) {
      return res.status(400).json({ error: "projectKey is required" });
    }

    const effectiveProjectKey = projectKey || "DEMO";

    let prdText = req.body.prompt || "";
    if (req.file) {
      if (req.file.originalname.toLowerCase().endsWith(".pdf")) {
        prdText = await extractTextFromPdfBuffer(prdBuffer);
      } else {
        prdText = prdBuffer.toString("utf-8");
      }
    }

    let businessDocs = [];
    if (userId && businessDocIds.length > 0) {
      businessDocs = await BusinessDocument.find({
        _id: { $in: businessDocIds },
        userId
      });
    }

    const business_docs = businessDocs.map(doc => doc.content);

    // Update session to processing
    await PRDSession.findByIdAndUpdate(sessionId, { status: 'processing', error: null });

    // Run agent in background
    runBacklogGenerator({
      raw_prd: prdText,
      business_docs,
      boardId,
      projectKey: effectiveProjectKey,
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
