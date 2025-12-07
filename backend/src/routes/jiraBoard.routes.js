import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getBoards } from "../controllers/jiraBoard.controller.js";

const router = Router();

router.get("/boards", auth, getBoards);

export default router;
