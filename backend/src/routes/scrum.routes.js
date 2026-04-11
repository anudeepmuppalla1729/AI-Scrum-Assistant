import express from "express";
import multer from "multer";
import {
  generateSuggestions,
  pushAISuggestionsToJira,
  chatWithScrumMaster,
  getChatHistory,
  getDailyStandupReport,
  getSprintRetrospectiveReport,
} from "../controllers/scrum.controller.js";
import { handleJiraWebhook } from "../controllers/webhook.controller.js";
import { auth } from "../middleware/auth.js";
import {
  getSessions,
  createSession,
  renameSession,
  deleteSession,
  sendMessage,
  getMessages,
} from "../controllers/chat.controller.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

const router = express.Router();

/**
 * @openapi
 * /api/v1/scrum/suggestions:
 *   post:
 *     summary: Generate AI suggestions from a PRD (PDF)
 *     tags:
 *       - Scrum
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               prdFile:
 *                 type: string
 *                 format: binary
 *                 description: The PRD PDF file to upload
 *               userPrompt:
 *                 type: string
 *                 description: User instructions to focus the ticket generation
 *     responses:
 *       200:
 *         description: AI-generated suggestions were created successfully
 *       400:
 *         description: Bad request (no file provided)
 *       500:
 *         description: Server error generating suggestions
 */
router.post("/suggestions", auth, upload.single("prdFile"), generateSuggestions);

/**
 * @openapi
 * /api/v1/scrum/pushSuggestionsToJira:
 *   post:
 *     summary: Push AI suggestions into Jira (Team-managed hierarchy)
 *     tags:
 *       - Scrum
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PushAISuggestionsRequest'
 *     responses:
 *       200:
 *         description: Issues created (partial success possible)
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Failed to push suggestions to Jira
 */
router.post("/pushSuggestionsToJira", auth, pushAISuggestionsToJira);

/**
 * @openapi
 * /api/v1/scrum/chat/sessions:
 *   get:
 *     summary: Get all chat sessions
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: List of chat sessions
 */
router.get("/chat/sessions", auth, getSessions);

/**
 * @openapi
 * /api/v1/scrum/chat/session:
 *   post:
 *     summary: Create a new chat session
 *     tags:
 *       - Chat
 *     responses:
 *       201:
 *         description: Created session
 */
router.post("/chat/session", auth, createSession);

/**
 * @openapi
 * /api/v1/scrum/chat/session/{sessionId}:
 *   patch:
 *     summary: Rename a chat session
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: Updated session
 *   delete:
 *     summary: Delete a chat session
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: Session deleted
 */
router.patch("/chat/session/:sessionId", auth, renameSession);
router.delete("/chat/session/:sessionId", auth, deleteSession);

/**
 * @openapi
 * /api/v1/scrum/chat/{sessionId}:
 *   post:
 *     summary: Send message to a session
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: Message sent and AI response received
 */
router.get("/chat/:sessionId/messages", auth, getMessages);
router.post("/chat/:sessionId", auth, sendMessage);

/**
 * @openapi
 * /api/v1/scrum/chat/history:
 *   get:
 *     summary: Get Chat History
 *     tags:
 *       - Scrum
 *     responses:
 *       200:
 *         description: Chat history
 */
router.get("/chat/history", getChatHistory);

/**
 * @openapi
 * /api/v1/scrum/standup:
 *   get:
 *     summary: Get Daily Standup Report
 *     tags:
 *       - Scrum
 *     parameters:
 *       - in: query
 *         name: projectKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Jira Project Key
 *     responses:
 *       200:
 *         description: Daily Standup Report
 *       400:
 *         description: Missing project key
 */
router.get("/standup", auth, getDailyStandupReport);

/**
 * @openapi
 * /api/v1/scrum/retrospective:
 *   get:
 *     summary: Get Sprint Retrospective Report
 *     tags:
 *       - Scrum
 *     parameters:
 *       - in: query
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *         description: Jira Sprint ID
 *     responses:
 *       200:
 *         description: Sprint Retrospective Report
 *       400:
 *         description: Missing sprint ID
 */
router.get("/retrospective", auth, getSprintRetrospectiveReport);

import {
  getPRDSessions,
  createPRDSession,
  getPRDSession,
  updatePRDSession,
  deletePRDSession,
} from "../controllers/prd.controller.js";

/**
 * @openapi
 * /api/v1/scrum/prd/sessions:
 *   get:
 *     summary: Get all PRD sessions
 *     tags:
 *       - PRD
 *     responses:
 *       200:
 *         description: List of PRD sessions
 */
router.get("/prd/sessions", auth, getPRDSessions);

/**
 * @openapi
 * /api/v1/scrum/prd/session:
 *   post:
 *     summary: Create a new PRD session
 *     tags:
 *       - PRD
 *     responses:
 *       201:
 *         description: Created session
 */
router.post("/prd/session", auth, createPRDSession);

/**
 * @openapi
 * /api/v1/scrum/prd/session/{sessionId}:
 *   get:
 *     summary: Get a specific PRD session
 *     tags:
 *       - PRD
 *     responses:
 *       200:
 *         description: PRD session details
 *   patch:
 *     summary: Update a PRD session
 *     tags:
 *       - PRD
 *     responses:
 *       200:
 *         description: Updated session
 *   delete:
 *     summary: Delete a PRD session
 *     tags:
 *       - PRD
 *     responses:
 *       200:
 *         description: Session deleted
 */
router.get("/prd/session/:sessionId", auth, getPRDSession);
router.patch("/prd/session/:sessionId", auth, updatePRDSession);
router.delete("/prd/session/:sessionId", auth, deletePRDSession);

import {
  pushBacklogItem,
  getPushHistory,
  searchBacklog,
} from "../controllers/backlog.controller.js";

/**
 * @openapi
 * /api/v1/scrum/backlog/push:
 *   post:
 *     summary: Push a crafted backlog item to Jira
 *     tags:
 *       - Backlog
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Issue created in Jira
 */
router.post("/backlog/push", auth, pushBacklogItem);

/**
 * @openapi
 * /api/v1/scrum/backlog/history:
 *   get:
 *     summary: Get push history
 *     tags:
 *       - Backlog
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pushed backlog items
 */
router.get("/backlog/history", auth, getPushHistory);

/**
 * @openapi
 * /api/v1/scrum/backlog/search:
 *   get:
 *     summary: Search existing Jira backlog for parent linking
 *     tags:
 *       - Backlog
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of matching Jira issues
 */
router.get("/backlog/search", auth, searchBacklog);

/**
 * @openapi
 * /api/v1/scrum/webhooks/jira:
 *   post:
 *     summary: Handle incoming Jira webhooks
 *     description: Endpoint configured in Jira to receive real-time updates when issues are created, updated, or deleted. Requires a specific payload format defined by Atlassian.
 *     tags:
 *       - Webhooks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               webhookEvent:
 *                 type: string
 *                 example: "jira:issue_updated"
 *                 description: The event that triggered the webhook.
 *               issue:
 *                 type: object
 *                 description: The updated Jira issue data.
 *                 properties:
 *                   id: 
 *                     type: string
 *                   key:
 *                     type: string
 *                     example: "SCRUM-10"
 *     responses:
 *       200:
 *         description: Webhook processed successfully. Returns immediately to prevent Jira from timing out.
 *       500:
 *         description: Failed to process or parse webhook payload.
 */
router.post("/webhooks/jira", handleJiraWebhook);
export default router;

