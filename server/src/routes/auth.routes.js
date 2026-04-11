import { Router } from "express";
import { createSession, getProfile } from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /auth/session:
 *   get:
 *     summary: Create or retrieve an authentication session
 *     description: Generates a JWT token for standard app authentication. Currently set up for testing purposes (hardcoded user ID/email).
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Session created successfully with a token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT Bearer token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       500:
 *         description: Server error during token generation
 */
router.get("/session", createSession);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     description: Returns the user's profile information extracted from the JWT token and database.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Protected route accessed"
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *                     iat:
 *                       type: integer
 *                     exp:
 *                       type: integer
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 */
router.get("/me", auth, getProfile);

export default router;
