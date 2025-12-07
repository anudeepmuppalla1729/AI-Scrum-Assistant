import { Router } from "express";
import { createSession, getProfile } from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();

router.get("/session", createSession);

router.get("/me", auth, getProfile);

export default router;
