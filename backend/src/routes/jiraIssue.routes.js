import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getSprintIssues } from "../controllers/jiraIssue.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/sprints/{sprintId}/issues:
 *   get:
 *     summary: Get issues for a specific Jira sprint
 *     tags:
 *       - Jira Issues
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the sprint
 *     responses:
 *       200:
 *         description: List of issues in the sprint
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error retrieving sprint issues
 */
router.get("/sprints/:sprintId/issues", auth, getSprintIssues);

export default router;
