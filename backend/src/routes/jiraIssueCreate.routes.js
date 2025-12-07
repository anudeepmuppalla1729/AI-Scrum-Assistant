import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { createIssue } from "../controllers/jiraIssueCreate.controller.js";

const router = Router();

router.post("/issues", auth, createIssue);

export default router;
