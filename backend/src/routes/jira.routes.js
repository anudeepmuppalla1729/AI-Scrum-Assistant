import { Router } from "express";
import { startJiraAuth, jiraCallback } from "../controllers/jira.controller.js";

const router = Router();

router.get("/login", startJiraAuth);
router.get("/callback", jiraCallback);

export default router;