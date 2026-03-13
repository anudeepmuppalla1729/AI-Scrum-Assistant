import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { fetchCloudId } from "../controllers/jiraCloud.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/cloud-id:
 *   get:
 *     summary: Fetch Atlassian cloud ID for the user
 *     tags:
 *       - Jira Cloud
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Retrieved cloud ID successfully
 *       400:
 *         description: No Jira tokens or sites found
 *       401:
 *         description: Jira session expired
 *       500:
 *         description: Failed to fetch cloud ID
 */
router.get("/cloud-id", auth, fetchCloudId);

export default router;
