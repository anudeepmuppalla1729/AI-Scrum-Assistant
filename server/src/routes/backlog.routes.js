import express from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import { generateSuggestions } from "../controllers/backlogGeneration.controller.js";
import { pushAISuggestionsToJira } from "../controllers/jiraPush.controller.js";
import {
  pushBacklogItem,
  getPushHistory,
  searchBacklog,
} from "../controllers/backlog.controller.js";
import {
  getGeneratedBacklog,
  updateGeneratedBacklog,
  updateStory,
  approveAndPush,
} from "../controllers/generatedBacklog.controller.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

const router = express.Router();

// ── Backlog Generation (PRD → AI suggestions) ──

/**
 * @openapi
 * /api/v1/backlog/suggestions:
 *   post:
 *     summary: Generate AI suggestions from a PRD (PDF)
 *     tags:
 *       - Backlog
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
 *               userPrompt:
 *                 type: string
 *     responses:
 *       202:
 *         description: Processing started in background
 *       400:
 *         description: Bad request
 */
router.post("/suggestions", optionalAuth, upload.single("prdFile"), generateSuggestions);

// ── Push to JIRA ──

/**
 * @openapi
 * /api/v1/backlog/pushToJira:
 *   post:
 *     summary: Push AI suggestions into Jira (team-managed hierarchy)
 *     tags:
 *       - Backlog
 *     responses:
 *       200:
 *         description: Issues created
 */
router.post("/pushToJira", auth, pushAISuggestionsToJira);

/**
 * @openapi
 * /api/v1/backlog/push:
 *   post:
 *     summary: Push a single crafted backlog item to Jira
 *     tags:
 *       - Backlog
 *     responses:
 *       201:
 *         description: Issue created in Jira
 */
router.post("/push", auth, pushBacklogItem);

// ── Generated Backlog CRUD ──

/**
 * @openapi
 * /api/v1/backlog/generated/{id}:
 *   get:
 *     summary: Get a generated backlog by ID or sessionId
 *     tags:
 *       - Backlog
 *   patch:
 *     summary: Update generated backlog (e.g., set rejected epics)
 *     tags:
 *       - Backlog
 */
router.get("/generated/:id", auth, getGeneratedBacklog);
router.patch("/generated/:id", auth, updateGeneratedBacklog);

/**
 * @openapi
 * /api/v1/backlog/generated/{id}/stories/{storyId}:
 *   patch:
 *     summary: Update a story in the generated backlog
 *     tags:
 *       - Backlog
 */
router.patch("/generated/:id/stories/:storyId", auth, updateStory);

/**
 * @openapi
 * /api/v1/backlog/generated/{id}/approve:
 *   post:
 *     summary: Approve and push backlog or epic to Jira
 *     tags:
 *       - Backlog
 */
router.post("/generated/:id/approve", auth, approveAndPush);

// ── Push History & Search ──

/**
 * @openapi
 * /api/v1/backlog/history:
 *   get:
 *     summary: Get push history
 *     tags:
 *       - Backlog
 */
router.get("/history", auth, getPushHistory);

/**
 * @openapi
 * /api/v1/backlog/search:
 *   get:
 *     summary: Search existing Jira backlog for parent linking
 *     tags:
 *       - Backlog
 */
router.get("/search", auth, searchBacklog);

export default router;
