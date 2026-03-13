import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getBoards } from "../controllers/jiraBoard.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/boards:
 *   get:
 *     summary: Get Jira boards for the authenticated user
 *     tags:
 *       - Jira Boards
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Jira boards
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error retrieving boards
 */
router.get("/boards", auth, getBoards);

export default router;
