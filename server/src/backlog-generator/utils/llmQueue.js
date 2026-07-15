import { Queue, Worker, QueueEvents } from "bullmq";
import connection from "../../config/redis.js";

// ── Queue (producer side) ──
export const llmQueue = new Queue("llm-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

// ── Job handlers registry ──
const jobHandlers = {};

export function registerLLMJobHandler(jobType, handler) {
  jobHandlers[jobType] = handler;
}

// ── Worker (consumer side, same process) ──
export const llmWorker = new Worker(
  "llm-processing",
  async (job) => {
    const handler = jobHandlers[job.name];
    if (!handler) throw new Error(`No handler registered for job type: ${job.name}`);
    return await handler(job.data);
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60000 },
  }
);

llmWorker.on("completed", (job) => {
  console.log(`[LLM Worker] Job ${job.id} (${job.name}) completed`);
});

llmWorker.on("failed", (job, err) => {
  console.error(`[LLM Worker] Job ${job.id} (${job.name}) failed:`, err.message);
});

// ── QueueEvents (for waitUntilFinished via Redis pub/sub) ──
const llmQueueEvents = new QueueEvents("llm-processing", { connection });

// ── Helper: add job and wait for result ──
// Preserves the await pattern: const result = await addLLMJob("type", data)
export async function addLLMJob(jobType, data) {
  const job = await llmQueue.add(jobType, data);
  return job.waitUntilFinished(llmQueueEvents);
}
