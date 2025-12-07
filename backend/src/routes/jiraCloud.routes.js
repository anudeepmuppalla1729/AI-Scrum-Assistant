import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { fetchCloudId } from "../controllers/jiraCloud.controller.js";

const router = Router();

router.get("/cloud-id", auth, fetchCloudId);

export default router;
