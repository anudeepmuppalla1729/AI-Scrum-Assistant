import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getPRDSessions,
  createPRDSession,
  getPRDSession,
  updatePRDSession,
  deletePRDSession,
} from "../controllers/prd.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/v1/prd/sessions:
 *   get:
 *     summary: Get all PRD sessions
 *     tags:
 *       - PRD
 *     responses:
 *       200:
 *         description: List of PRD sessions
 */
router.get("/sessions", auth, getPRDSessions);

/**
 * @openapi
 * /api/v1/prd/session:
 *   post:
 *     summary: Create a new PRD session
 *     tags:
 *       - PRD
 *     responses:
 *       201:
 *         description: Created session
 */
router.post("/session", auth, createPRDSession);

/**
 * @openapi
 * /api/v1/prd/session/{sessionId}:
 *   get:
 *     summary: Get a specific PRD session
 *     tags:
 *       - PRD
 *   patch:
 *     summary: Update a PRD session
 *     tags:
 *       - PRD
 *   delete:
 *     summary: Delete a PRD session
 *     tags:
 *       - PRD
 */
router.get("/session/:sessionId", auth, getPRDSession);
router.patch("/session/:sessionId", auth, updatePRDSession);
router.delete("/session/:sessionId", auth, deletePRDSession);

export default router;
