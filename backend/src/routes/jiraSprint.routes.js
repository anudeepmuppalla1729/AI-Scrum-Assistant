import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getSprints } from "../controllers/jiraSprint.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/boards/{boardId}/sprints:
 *   get:
 *     summary: Get sprints for a specific Jira board
 *     tags:
 *       - Jira Sprints
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the board
 *     responses:
 *       200:
 *         description: List of sprints for the board
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error retrieving sprints
 */
router.get("/boards/:boardId/sprints", auth, getSprints);

export default router;
