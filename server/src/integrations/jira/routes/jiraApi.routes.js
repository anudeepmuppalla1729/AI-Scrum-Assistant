import { Router } from "express";
import { auth } from "../../../middleware/auth.js";
import { getProjects } from "../controllers/jiraApi.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/projects:
 *   get:
 *     summary: Get Jira projects for the authenticated user
 *     description: Fetches a list of all Jira projects available to the authenticated user on their authorized Jira Cloud site.
 *     tags:
 *       - Jira API
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A JSON array of Jira projects.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "10000"
 *                     description: The unique ID of the project.
 *                   key:
 *                     type: string
 *                     example: "SCRUM"
 *                     description: The project key.
 *                   name:
 *                     type: string
 *                     example: "Scrum Team Project"
 *                     description: The readable name of the project.
 *                   avatarUrls:
 *                     type: object
 *                     description: Object containing URLs for the project's avatar icons.
 *       401:
 *         description: Unauthorized. The internal JWT is invalid, or the Jira Access Token has expired.
 *       500:
 *         description: Server error while fetching or parsing project data.
 */
router.get("/projects", auth, getProjects);

export default router;
