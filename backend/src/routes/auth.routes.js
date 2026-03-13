import { Router } from "express";
import { createSession, getProfile } from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /auth/session:
 *   get:
 *     summary: Create or retrieve an authentication session
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Session created successfully with a token
 *       500:
 *         description: Server error
 */
router.get("/session", createSession);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *       401:
 *         description: Unauthorized
 */
router.get("/me", auth, getProfile);

export default router;
