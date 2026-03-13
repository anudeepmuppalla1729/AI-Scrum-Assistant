import { Router } from "express";
import { startJiraAuth, jiraCallback } from "../controllers/jira.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/login:
 *   get:
 *     summary: Initiate Jira OAuth login flow
 *     tags:
 *       - Jira Auth
 *     responses:
 *       302:
 *         description: Redirects to Atlassian OAuth authorization URL
 */
router.get("/login", startJiraAuth);

/**
 * @openapi
 * /auth/jira/callback:
 *   get:
 *     summary: Callback URL for Jira OAuth
 *     tags:
 *       - Jira Auth
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Atlassian
 *     responses:
 *       302:
 *         description: Redirects to frontend with JWT token on success
 *       400:
 *         description: Authorization code missing
 *       500:
 *         description: Jira OAuth failed
 */
router.get("/callback", jiraCallback);

export default router;