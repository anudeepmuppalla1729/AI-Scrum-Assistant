import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

const { emitAgentEvent, getCurrentAgentState, default: agentEventBus } = await import(
  "../../src/backlog-generator/agentEventBus.js"
);

describe("agentEventBus", () => {
  beforeEach(() => {
    // Reset state by emitting a fresh run_start + run_end cycle
    emitAgentEvent("run_start", { runId: "reset", nodeLabels: {} });
    emitAgentEvent("run_end", { success: true });
  });

  it("sets isRunning on run_start", () => {
    emitAgentEvent("run_start", { runId: "test-1", nodeLabels: {} });
    const state = getCurrentAgentState();
    assert.equal(state.isRunning, true);
    assert.equal(state.runId, "test-1");
  });

  it("sets activeNode on node_start", () => {
    emitAgentEvent("run_start", { runId: "test-2", nodeLabels: {} });
    emitAgentEvent("node_start", { node: "orchestrator", label: "Orchestrator" });
    const state = getCurrentAgentState();
    assert.equal(state.activeNode, "orchestrator");
  });

  it("clears activeNode on node_end", () => {
    emitAgentEvent("run_start", { runId: "test-3", nodeLabels: {} });
    emitAgentEvent("node_start", { node: "orchestrator" });
    emitAgentEvent("node_end", { node: "orchestrator" });
    const state = getCurrentAgentState();
    assert.equal(state.activeNode, null);
  });

  it("sets isRunning false on run_end", () => {
    emitAgentEvent("run_start", { runId: "test-4", nodeLabels: {} });
    emitAgentEvent("run_end", { success: true });
    const state = getCurrentAgentState();
    assert.equal(state.isRunning, false);
    assert.equal(state.activeNode, null);
  });

  it("sets isRunning false on error", () => {
    emitAgentEvent("run_start", { runId: "test-5", nodeLabels: {} });
    emitAgentEvent("error", { message: "boom" });
    const state = getCurrentAgentState();
    assert.equal(state.isRunning, false);
  });

  it("accumulates events in the events array", () => {
    emitAgentEvent("run_start", { runId: "test-6", nodeLabels: {} });
    emitAgentEvent("node_start", { node: "a" });
    emitAgentEvent("node_end", { node: "a" });
    emitAgentEvent("run_end", { success: true });
    const state = getCurrentAgentState();
    assert.ok(state.events.length >= 4);
  });

  it("stores nodeContexts", () => {
    emitAgentEvent("run_start", { runId: "test-7", nodeLabels: {} });
    emitAgentEvent("node_context", {
      node: "orchestrator",
      inputs: { source: "test" },
      outputs: { epics_count: 3 },
      invocation: 1,
    });
    const state = getCurrentAgentState();
    assert.ok(state.nodeContexts["orchestrator"]);
    assert.equal(state.nodeContexts["orchestrator"].length, 1);
    assert.equal(state.nodeContexts["orchestrator"][0].outputs.epics_count, 3);
  });

  it("emits agent_event on the event bus", (_, done) => {
    agentEventBus.once("agent_event", (event) => {
      assert.equal(event.type, "run_start");
      assert.equal(event.runId, "test-bus");
      done();
    });
    emitAgentEvent("run_start", { runId: "test-bus", nodeLabels: {} });
  });
});
