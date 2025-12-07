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

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} Baby!!!`);
    console.log(`Open in browser: http://localhost:${PORT} Baby!!!`);
    console.log("✓ MongoDB Connected");
  });
}

startServer();
