import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getSprints } from "../controllers/jiraSprint.controller.js";

const router = Router();

router.get("/boards/:boardId/sprints", auth, getSprints);

export default router;
