import express from "express";
import { auth } from "../middleware/auth.js";
import { handleJiraWebhook } from "../controllers/webhook.controller.js";
import {
  getDailyStandupReport,
  getSprintRetrospectiveReport,
} from "../controllers/scrumReports.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/scrum/standup:
 *   get:
 *     summary: Get Daily Standup Report
 *     tags:
 *       - Scrum
 *     parameters:
 *       - in: query
 *         name: projectKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Jira Project Key
 *     responses:
 *       200:
 *         description: Daily Standup Report
 *       400:
 *         description: Missing project key
 */
router.get("/standup", auth, getDailyStandupReport);

/**
 * @openapi
 * /api/v1/scrum/retrospective:
 *   get:
 *     summary: Get Sprint Retrospective Report
 *     tags:
 *       - Scrum
 *     parameters:
 *       - in: query
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: string
 *         description: Jira Sprint ID
 *     responses:
 *       200:
 *         description: Sprint Retrospective Report
 *       400:
 *         description: Missing sprint ID
 */
router.get("/retrospective", auth, getSprintRetrospectiveReport);

/**
 * @openapi
 * /api/v1/scrum/webhooks/jira:
 *   post:
 *     summary: Handle incoming Jira webhooks
 *     tags:
 *       - Webhooks
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post("/webhooks/jira", handleJiraWebhook);

export default router;
