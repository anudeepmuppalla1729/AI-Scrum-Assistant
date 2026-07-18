import express from "express";
import { optionalAuth } from "../middleware/optionalAuth.js";
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
router.get("/sessions", optionalAuth, getPRDSessions);

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
router.post("/session", optionalAuth, createPRDSession);

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
router.get("/session/:sessionId", optionalAuth, getPRDSession);
router.patch("/session/:sessionId", optionalAuth, updatePRDSession);
router.delete("/session/:sessionId", optionalAuth, deletePRDSession);

export default router;
