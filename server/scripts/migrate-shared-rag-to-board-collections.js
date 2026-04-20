import dotenv from "dotenv";
import { migrateSharedCollectionToBoardCollections } from "../src/services/ai/rag.service.js";

dotenv.config();

const parseArgs = (argv) => {
  const args = {};
  argv.forEach((rawArg) => {
    if (!rawArg.startsWith("--")) return;
    const [key, value] = rawArg.slice(2).split("=");
    args[key] = value === undefined ? true : value;
  });
  return args;
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  const defaultBoardId =
    args.defaultBoardId || process.env.DEFAULT_JIRA_BOARD_ID || null;
  const batchSize = toPositiveInt(args.batchSize, 200);
  const dryRun = args.dryRun === true || args.dryRun === "true";

  console.log("Starting RAG migration with settings:", {
    defaultBoardId,
    batchSize,
    dryRun,
  });

  const result = await migrateSharedCollectionToBoardCollections({
    defaultBoardId,
    batchSize,
    dryRun,
  });

  console.log("Migration completed.");
  console.log(JSON.stringify(result, null, 2));
};

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
