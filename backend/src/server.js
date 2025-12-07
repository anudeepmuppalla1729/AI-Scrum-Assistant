import express from "express";
import cors from "cors";
import scrumRoutes from "./routes/scrum.routes.js";
import { setupSwagger } from "./swagger.js";
import authRoutes from "./routes/auth.routes.js";
import jiraRoutes from "./routes/jira.routes.js";
import jiraCloudRoutes from "./routes/jiraCloud.routes.js";
import jiraApiRoutes from "./routes/jiraApi.routes.js";
import jiraBoardRoutes from "./routes/jiraBoard.routes.js";
import jiraSprintRoutes from "./routes/jiraSprint.routes.js";
import jiraIssueRoutes from "./routes/jiraIssue.routes.js";
import jiraIssueCreateRoutes from "./routes/jiraIssueCreate.routes.js";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "10mb" })); // Allows larger payloads
app.use("/auth", authRoutes);
app.use("/auth/jira", jiraRoutes);

// Swagger UI
setupSwagger(app);

app.get("/", (req, res) => {
  res.status(200).send({
    message: "AI Scrum Assistant Backend is running.",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth/jira", jiraCloudRoutes);
app.use("/api/v1/scrum", scrumRoutes);
app.use("/auth/jira", jiraApiRoutes);
app.use("/auth/jira", jiraBoardRoutes);
app.use("/auth/jira", jiraSprintRoutes);
app.use("/auth/jira", jiraIssueRoutes);
app.use("/auth/jira", jiraIssueCreateRoutes);



app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).send({
    error: message,
  });
});

export default app;
