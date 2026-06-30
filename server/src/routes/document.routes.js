import express from "express";
import multer from "multer";
import {
  uploadDocument,
  listDocuments,
  removeDocument,
} from "../controllers/document.controller.js";
import { auth as authenticate } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", listDocuments);
router.delete("/:id", removeDocument);

export default router;
