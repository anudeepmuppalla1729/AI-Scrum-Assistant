import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getProjects } from "../controllers/jiraApi.controller.js";

const router = Router();

router.get("/projects", auth, getProjects);

export default router;
