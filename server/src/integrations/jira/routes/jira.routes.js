import { Router } from "express";
import { startJiraAuth, jiraCallback } from "../controllers/jira.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/login:
 *   get:
 *     summary: Initiate Jira OAuth login flow
 *     description: Redirects the user's browser to the Atlassian OAuth 2.0 authorization screen to request permissions (scopes) for the app.
 *     tags:
 *       - Jira Auth
 *     responses:
 *       302:
 *         description: Redirects to `https://auth.atlassian.com/authorize` with specific query parameters.
 */
router.get("/login", startJiraAuth);

/**
 * @openapi
 * /auth/jira/callback:
 *   get:
 *     summary: Callback URL for Jira OAuth
 *     description: Handles the redirect from Atlassian after a user authorizes the app. It exchanges the authorization code for an access token, fetches the user's Atlassian profile, updates the local database, and issues an internal JWT token.
 *     tags:
 *       - Jira Auth
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: The short-lived authorization code provided by Atlassian.
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: The state parameter passed during the login request (used for CSRF protection).
 *     responses:
 *       302:
 *         description: Redirects to the frontend success URL with the generated internal JWT token appended as a query parameter (`?token=...`).
 *       400:
 *         description: missing authorization code in query parameters.
 *       500:
 *         description: Internal server error (e.g., token exchange failed or database error).
 */
router.get("/callback", jiraCallback);

export default router;