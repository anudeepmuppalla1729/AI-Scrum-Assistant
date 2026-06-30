import { Router } from "express";
import agentEventBus, { getCurrentAgentState } from "../backlog-generator/agentEventBus.js";

const router = Router();

/**
 * SSE endpoint: GET /api/v1/events/agent-status
 * Streams real-time LangGraph node execution events to connected clients.
 * No authentication required (local observability).
 */
router.get("/agent-status", (req, res) => {
  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial connected event
  res.write(
    `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`
  );
  const currentState = getCurrentAgentState();
  
  // Replay run start and state
  if (currentState.isRunning && currentState.events.length > 0) {
    // Send the first run_start event
    res.write(`data: ${JSON.stringify(currentState.events[0])}\n\n`);
  }

  // Replay node contexts if available
  if (currentState.nodeContexts) {
    Object.keys(currentState.nodeContexts).forEach(nodeId => {
      const contexts = currentState.nodeContexts[nodeId];
      contexts.forEach(ctx => {
        res.write(`data: ${JSON.stringify({
          type: "node_context",
          node: nodeId,
          ...ctx
        })}\n\n`);
      });
    });
  }

  if (currentState.events && currentState.events.length > 0) {
    // Replay the entire history of the current/last run
    currentState.events.forEach(event => {
      if (event.type !== "run_start" && event.type !== "node_context") {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    });
  }

  // Keep-alive heartbeat every 15s
  const heartbeat = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`
    );
  }, 15000);

  // Forward agent events to this SSE client
  const onEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  agentEventBus.on("agent_event", onEvent);

  // Cleanup on client disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    agentEventBus.off("agent_event", onEvent);
  });
});

export default router;
