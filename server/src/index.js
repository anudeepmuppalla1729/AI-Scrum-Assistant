import "dotenv/config";
import app from "./server.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 2000;

async function startServer() {
  if (!process.env.GOOGLE_API_KEY) {
    console.error(
      "FATAL ERROR: GOOGLE_API_KEY is not defined in the .env file."
    );
    process.exit(1);
  }

  await connectDB();

  // Reset any sessions that were left in 'processing' state due to a server crash/restart
  const { default: PRDSession } = await import("./models/PRDSession.js");
  const cleanupRes = await PRDSession.updateMany(
    { status: 'processing' },
    { status: 'failed', error: 'Pipeline interrupted by server restart.' }
  );
  if (cleanupRes.modifiedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanupRes.modifiedCount} stuck background sessions.`);
  }

  // Reset any epics stuck in 'pushing' state
  const { default: GeneratedBacklog } = await import("./models/GeneratedBacklog.js");
  const backlogCleanupRes = await GeneratedBacklog.updateMany(
    { "epic_statuses.status": "pushing" },
    { $set: { "epic_statuses.$[elem].status": "failed", "epic_statuses.$[elem].jira_push_result": { error: "Push interrupted by server restart." } } },
    { arrayFilters: [{ "elem.status": "pushing" }] }
  );
  if (backlogCleanupRes.modifiedCount > 0) {
    console.log(`🧟 Cleaned up ${backlogCleanupRes.modifiedCount} backlogs with zombie pushing epics.`);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} Baby!!!`);
    console.log(`Open in browser: http://localhost:${PORT} Baby!!!`);
    console.log("✓ MongoDB Connected");

    // Check embedding service health
    const embeddingUrl = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8001";
    fetch(`${embeddingUrl}/health`)
      .then(res => res.json())
      .then(data => {
        console.log(`✓ Embedding Service Online (${data.model}, ${data.dimension || "loading..."}d)`);
      })
      .catch(err => {
        console.error(`✗ Embedding Service Offline: ${err.message}`);
      });
  });
}

startServer();
