import "dotenv/config";
import mongoose from "mongoose";
import GeneratedBacklog from "../src/models/GeneratedBacklog.js";
import connectDB from "../src/config/db.js";

async function run() {
  await connectDB();
  const backlogCleanupRes = await GeneratedBacklog.updateMany(
    { "epic_statuses.status": "pushing" },
    { $set: { "epic_statuses.$[elem].status": "failed", "epic_statuses.$[elem].jira_push_result": { error: "Push interrupted by server restart." } } },
    { arrayFilters: [{ "elem.status": "pushing" }] }
  );
  console.log(`🧟 Cleaned up ${backlogCleanupRes.modifiedCount} backlogs with zombie pushing epics.`);
  process.exit(0);
}

run().catch(console.error);
