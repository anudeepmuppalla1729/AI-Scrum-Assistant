import { Router } from "express";
import { auth } from "../../../middleware/auth.js";
import { createIssue } from "../controllers/jiraIssueCreate.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/issues:
 *   post:
 *     summary: Create a new Jira issue
 *     description: Submits a payload to create a new issue (e.g., Task, Story, Bug) in the configured Jira Cloud project.
 *     tags:
 *       - Jira Issues
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - summary
 *               - issuetype
 *             properties:
 *               summary:
 *                 type: string
 *                 example: "Implement new authentication flow"
 *                 description: Title of the issue
 *               description:
 *                 type: string
 *                 example: "As a user, I want to securely log in..."
 *                 description: Detailed description of the issue. Use standard text; Atlassian Document Format translation happens on the backend if configured.
 *               issuetype:
 *                 type: string
 *                 example: "Story"
 *                 description: Type of issue (e.g., Task, Story, Bug, Epic)
 *               parentEpic:
 *                 type: string
 *                 example: "SCRUM-1"
 *                 description: Provide the Epic Issue issue key if this issue should be linked to an Epic. (Team-managed projects usually use parent-child standard hierarchy).
 *     responses:
 *       200:
 *         description: Issue created successfully in Jira.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "10025"
 *                 key:
 *                   type: string
 *                   example: "SCRUM-12"
 *                 self:
 *                   type: string
 *                   description: URL to the created issue resource.
 *       400:
 *         description: Missing required fields or bad payload format.
 *       500:
 *         description: Failed to create issue. Indicates a problem with Jira permissions or Jira availability.
 */
router.post("/issues", auth, createIssue);

export default router;
