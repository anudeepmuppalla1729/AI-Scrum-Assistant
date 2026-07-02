import { Router } from "express";
import { auth } from "../../../middleware/auth.js";
import { getSprints } from "../controllers/jiraSprint.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/boards/{boardId}/sprints:
 *   get:
 *     summary: Get sprints for a specific Jira board
 *     description: Retrieves all active and future sprints associated with a specific Jira board. Used to populate sprint selection dropdowns.
 *     tags:
 *       - Jira Sprints
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The internal numerical ID of the Jira board.
 *     responses:
 *       200:
 *         description: A JSON array of Jira sprints.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 5
 *                   state:
 *                     type: string
 *                     example: "active"
 *                     description: The current status of the sprint (e.g., active, future, closed).
 *                   name:
 *                     type: string
 *                     example: "Sprint 42"
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-03-01T09:00:00.000Z"
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-03-15T17:00:00.000Z"
 *       401:
 *         description: Unauthorized. Jira access token expired.
 *       500:
 *         description: Server error retrieving sprints.
 */
router.get("/boards/:boardId/sprints", auth, getSprints);

export default router;
