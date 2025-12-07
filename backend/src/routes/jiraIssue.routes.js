import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getSprintIssues } from "../controllers/jiraIssue.controller.js";

const router = Router();

router.get("/sprints/:sprintId/issues", auth, getSprintIssues);

export default router;
