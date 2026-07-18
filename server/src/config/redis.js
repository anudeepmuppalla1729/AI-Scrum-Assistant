import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,  // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    return delay;
  },
  keepAlive: 30000,
  connectTimeout: 10000,
  enableOfflineQueue: true,
});

connection.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

connection.on("connect", () => {
  console.log("[Redis] Connected");
});

export default connection;
