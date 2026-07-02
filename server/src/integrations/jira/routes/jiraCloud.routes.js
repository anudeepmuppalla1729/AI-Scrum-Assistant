import { Router } from "express";
import { auth } from "../../../middleware/auth.js";
import { fetchCloudId } from "../controllers/jiraCloud.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/cloud-id:
 *   get:
 *     summary: Fetch Atlassian cloud ID for the user
 *     description: Calls the Atlassian API (`/oauth/token/accessible-resources`) to find the cloud ID (site ID) the user has explicitly authorized. This ID is necessary for constructing base URLs for subsequent Jira API calls.
 *     tags:
 *       - Jira Cloud
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved cloud ID and site details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cloudId:
 *                   type: string
 *                   example: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p"
 *                   description: The UUID of the Atlassian cloud site.
 *                 siteName:
 *                   type: string
 *                   example: "mycompany"
 *                   description: The name of the Atlassian site.
 *                 url:
 *                   type: string
 *                   example: "https://mycompany.atlassian.net"
 *                   description: The base URL of the Atlassian site.
 *       400:
 *         description: Bad Request. Either no Jira tokens exist for the user, or no accessible Jira sites were found.
 *       401:
 *         description: Unauthorized. Jira session has expired. The user needs to authenticate with Jira again.
 *       500:
 *         description: Internal server error while fetching the cloud ID.
 */
router.get("/cloud-id", auth, fetchCloudId);

export default router;
