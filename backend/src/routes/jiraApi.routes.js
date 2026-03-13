import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getProjects } from "../controllers/jiraApi.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/projects:
 *   get:
 *     summary: Get Jira projects for the authenticated user
 *     tags:
 *       - Jira API
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Jira projects
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error retrieving projects
 */
router.get("/projects", auth, getProjects);

export default router;
