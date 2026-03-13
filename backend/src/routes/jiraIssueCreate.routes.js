import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { createIssue } from "../controllers/jiraIssueCreate.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/issues:
 *   post:
 *     summary: Create a new Jira issue
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
 *             properties:
 *               summary:
 *                 type: string
 *                 description: Title of the issue
 *               description:
 *                 type: string
 *                 description: Description of the issue
 *               issuetype:
 *                 type: string
 *                 description: Type of issue (e.g., Task, Bug)
 *               parentEpic:
 *                 type: string
 *                 description: Epic link if applicable
 *     responses:
 *       200:
 *         description: Issue created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Failed to create issue
 */
router.post("/issues", auth, createIssue);

export default router;
