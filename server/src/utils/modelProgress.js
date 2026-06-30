import agentEventBus from "../backlog-generator/agentEventBus.js";

let lastEmitTime = 0;
const progressTracker = new Map();

export const modelProgressCallback = (info) => {
  console.log("Model Progress:", info.status, info.file, info.progress);
  if (info.status === "progress") {
    progressTracker.set(info.file, info.progress);
  } else if (info.status === "done") {
    progressTracker.set(info.file, 100);
  }

  const now = Date.now();
  // Throttle events to every 250ms to prevent overwhelming the SSE stream
  if (now - lastEmitTime > 250 || info.status === "done" || info.status === "ready") {
    lastEmitTime = now;
    
    // Calculate total progress across all currently tracking files
    let totalProgress = 0;
    if (progressTracker.size > 0) {
      let sum = 0;
      for (const p of progressTracker.values()) {
        sum += p;
      }
      totalProgress = Math.round(sum / progressTracker.size);
    }

    agentEventBus.emit("agent_event", {
      type: "model_download",
      timestamp: new Date().toISOString(),
      file: info.file,
      status: info.status,
      progress: info.progress || totalProgress,
      totalProgress: totalProgress
    });
  }
};
