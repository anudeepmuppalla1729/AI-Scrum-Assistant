import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getSessions,
  createSession,
  renameSession,
  deleteSession,
  sendMessage,
  getMessages,
} from "../controllers/chat.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/chat/sessions:
 *   get:
 *     summary: Get all chat sessions
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: List of chat sessions
 */
router.get("/sessions", auth, getSessions);

/**
 * @openapi
 * /api/v1/chat/session:
 *   post:
 *     summary: Create a new chat session
 *     tags:
 *       - Chat
 *     responses:
 *       201:
 *         description: Created session
 */
router.post("/session", auth, createSession);

/**
 * @openapi
 * /api/v1/chat/session/{sessionId}:
 *   patch:
 *     summary: Rename a chat session
 *     tags:
 *       - Chat
 *   delete:
 *     summary: Delete a chat session
 *     tags:
 *       - Chat
 */
router.patch("/session/:sessionId", auth, renameSession);
router.delete("/session/:sessionId", auth, deleteSession);

/**
 * @openapi
 * /api/v1/chat/{sessionId}/messages:
 *   get:
 *     summary: Get messages for a session
 *     tags:
 *       - Chat
 */
router.get("/:sessionId/messages", auth, getMessages);

/**
 * @openapi
 * /api/v1/chat/{sessionId}:
 *   post:
 *     summary: Send message to a session
 *     tags:
 *       - Chat
 */
router.post("/:sessionId", auth, sendMessage);

export default router;
