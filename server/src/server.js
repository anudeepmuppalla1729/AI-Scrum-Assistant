import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { setupSwagger } from "./swagger.js";

// ── Auth ──
import authRoutes from "./routes/auth.routes.js";

// ── Jira Integration ──
import jiraRoutes from "./integrations/jira/routes/jira.routes.js";
import jiraCloudRoutes from "./integrations/jira/routes/jiraCloud.routes.js";
import jiraApiRoutes from "./integrations/jira/routes/jiraApi.routes.js";
import jiraBoardRoutes from "./integrations/jira/routes/jiraBoard.routes.js";
import jiraSprintRoutes from "./integrations/jira/routes/jiraSprint.routes.js";
import jiraIssueRoutes from "./integrations/jira/routes/jiraIssue.routes.js";
import jiraIssueCreateRoutes from "./integrations/jira/routes/jiraIssueCreate.routes.js";

// ── Core Routes ──
import backlogRoutes from "./routes/backlog.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import prdRoutes from "./routes/prd.routes.js";
import scrumRoutes from "./routes/scrum.routes.js";
import documentRoutes from "./routes/document.routes.js";
import agentEventsRoutes from "./routes/agentEvents.routes.js";

const app = express();

const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5174",
  ],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for dev)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use(express.json({ limit: "10mb" })); // Allows larger payloads
// ── Auth ──
app.use("/auth", authRoutes);
app.use("/auth/jira", jiraRoutes);
app.use("/auth/jira", jiraCloudRoutes);
app.use("/auth/jira", jiraApiRoutes);
app.use("/auth/jira", jiraBoardRoutes);
app.use("/auth/jira", jiraSprintRoutes);
app.use("/auth/jira", jiraIssueRoutes);
app.use("/auth/jira", jiraIssueCreateRoutes);

// ── Core API ──
app.use("/api/v1/backlog", backlogRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/prd", prdRoutes);
app.use("/api/v1/scrum", scrumRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/events", agentEventsRoutes);

// Swagger UI
setupSwagger(app);

app.get("/", (req, res) => {
  res.status(200).send({
    message: "AI Scrum Assistant Backend is running.",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});



app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).send({
    error: message,
  });
});

export default app;
