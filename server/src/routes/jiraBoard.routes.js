import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getBoards } from "../controllers/jiraBoard.controller.js";

const router = Router();

/**
 * @openapi
 * /auth/jira/boards:
 *   get:
 *     summary: Get Jira boards for the authenticated user
 *     description: Retrieves a list of Jira boards associated with the user's Jira Cloud site.
 *     tags:
 *       - Jira Boards
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A JSON array of Jira boards.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                     description: The unique numerical ID of the board.
 *                   name:
 *                     type: string
 *                     example: "Sprint Board"
 *                     description: The readable name of the board.
 *                   type:
 *                     type: string
 *                     example: "scrum"
 *                     description: The type of board (e.g., "scrum" or "kanban").
 *       401:
 *         description: Unauthorized. The internal JWT is invalid, or the Jira Access Token has expired.
 *       500:
 *         description: Server error while fetching or parsing board data.
 */
router.get("/boards", auth, getBoards);

export default router;
