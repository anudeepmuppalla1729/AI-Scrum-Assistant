import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getSprintIssues } from "../controllers/jiraIssue.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/sprints/{sprintId}/issues:
 *   get:
 *     summary: Get issues for a specific Jira sprint
 *     description: Retrieves all issues (tasks, bugs, stories, etc.) assigned to a specific sprint on the Jira Cloud site.
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
 *         description: The internal numerical or string ID of the Jira sprint.
 *     responses:
 *       200:
 *         description: A JSON array containing the detailed Jira issues.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "10050"
 *                   key:
 *                     type: string
 *                     example: "SCRUM-15"
 *                     description: The issue key formatting.
 *                   fields:
 *                     type: object
 *                     description: Contains the issue summary, description, and status.
 *                     example: { summary: "Build login page", status: { name: "In Progress" } }
 *       401:
 *         description: Unauthorized. Token invalid or expired.
 *       500:
 *         description: Server error retrieving sprint issues.
 */
router.get("/sprints/:sprintId/issues", auth, getSprintIssues);

export default router;
