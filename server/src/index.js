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

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} Baby!!!`);
    console.log(`Open in browser: http://localhost:${PORT} Baby!!!`);
    console.log("✓ MongoDB Connected");
  });
}

startServer();
