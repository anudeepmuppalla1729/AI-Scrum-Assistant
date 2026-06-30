import { EventEmitter } from "events";

/**
 * Global event bus for agent execution status.
 * Emits events as the LangGraph pipeline progresses through nodes.
 */
const agentEventBus = new EventEmitter();
agentEventBus.setMaxListeners(50);

let currentState = {
  isRunning: false,
  activeNode: null,
  runId: null,
  nodeLabels: null,
  events: [],
  nodeContexts: {}, // Map of nodeId → { inputs, outputs, timestamp, duration }
};

/**
 * Emit an agent status event.
 * @param {"node_start"|"node_end"|"node_context"|"run_start"|"run_end"|"backlog_ready"|"error"} eventType
 * @param {object} payload
 */
export const emitAgentEvent = (eventType, payload) => {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (eventType === "run_start") {
    currentState = { 
      isRunning: true, 
      activeNode: null, 
      runId: payload?.runId, 
      nodeLabels: payload?.nodeLabels,
      events: [event],
      nodeContexts: {},
    };
  } else {
    currentState.events.push(event);
    
    if (eventType === "node_start") {
      currentState.activeNode = payload?.node;
    } else if (eventType === "node_end") {
      currentState.activeNode = null;
    } else if (eventType === "node_context") {
      // Store context snapshot for this node
      const nodeId = payload?.node;
      if (nodeId) {
        if (!currentState.nodeContexts[nodeId]) {
          currentState.nodeContexts[nodeId] = [];
        }
        currentState.nodeContexts[nodeId].push({
          inputs: payload?.inputs || {},
          outputs: payload?.outputs || {},
          timestamp: event.timestamp,
          invocation: payload?.invocation || 0,
        });
      }
    } else if (eventType === "run_end" || eventType === "error") {
      currentState.isRunning = false;
      currentState.activeNode = null;
    }
  }

  agentEventBus.emit("agent_event", event);
};

export const getCurrentAgentState = () => currentState;

export default agentEventBus;
