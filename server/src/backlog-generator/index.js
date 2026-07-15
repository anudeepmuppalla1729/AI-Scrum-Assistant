import { StateGraph, START, END } from "@langchain/langgraph";
import { StateAnnotation } from "./state.js";
import { jiraFetchNode } from "./nodes/jiraFetch.js";
import { prdIngestionNode } from "./nodes/prdIngestion.js";
import { orchestratorNode } from "./nodes/orchestrator.js";
import { routingNode } from "./nodes/routing.js";
import { storyWriterNode } from "./nodes/storyWriter.js";
import { validationNode } from "./nodes/validation.js";
import { feedbackNode } from "./nodes/feedback.js";
import { assemblerNode } from "./nodes/assembler.js";
import { emitAgentEvent } from "./agentEventBus.js";

const NODE_LABELS = {
  jira_fetch: "Jira Context Fetch",
  prd_ingestion: "PRD Ingestion & Vectorization",
  orchestrator: "Orchestrator — Planning Epics",
  routing: "Routing — Dispatching Stories",
  story_writer: "Story Writer — Drafting Tickets",
  validation: "Validation — Quality Check",
  feedback: "Feedback — Revisions",
  assembler: "Assembler — Final Output",
};

// Track invocation counts per node per run
let nodeInvocations = {};

/**
 * Extract observability context from each node's output chunk.
 * Returns a summary object safe to send over SSE (no huge payloads).
 */
const extractNodeContext = (nodeName, chunk) => {
  const data = chunk[nodeName] || {};

  switch (nodeName) {
    case "jira_fetch":
      return {
        inputs: { source: "Jira API" },
        outputs: {
          velocity: data.jira_context?.velocity,
          team: data.jira_context?.team,
          sprint_cadence: data.jira_context?.sprint_cadence,
          previous_sprints_count: data.jira_context?.previous_sprints?.length || 0,
          open_bugs: data.jira_context?.open_bugs,
        },
      };

    case "prd_ingestion":
      const hasBizDocs = (data.business_docs_count || 0) > 0;
      return {
        inputs: { source: hasBizDocs ? "PRD Document + Business Docs" : "PRD Document" },
        outputs: {
          token_count: data.prd_token_count,
          complexity_tier: data.complexity_tier,
          business_docs_count: data.business_docs_count || 0,
        },
      };

    case "orchestrator":
      return {
        inputs: { source: "PRD + Jira Context + Business Docs" },
        outputs: {
          epics_count: data.orchestrator_contract?.epics?.length || 0,
          total_stories: data.orchestrator_contract?.epics?.reduce(
            (sum, e) => sum + (e.stories?.length || 0), 0
          ) || 0,
          total_sprints: data.orchestrator_contract?.total_sprints,
          capacity_per_sprint: data.orchestrator_contract?.capacity_per_sprint,
          epics_summary: data.orchestrator_contract?.epics?.map(e => ({
            id: e.id,
            title: e.title,
            priority: e.priority,
            stories_count: e.stories?.length || 0,
          })) || [],
        },
      };

    case "routing":
      return {
        inputs: { source: "Orchestrator Contract" },
        outputs: {
          dispatched_stories: data.send_list?.length || 0,
        },
      };

    case "story_writer":
      // story_writer may produce partial results (one story at a time via Send)
      const stories = Array.isArray(data.current_batch) ? data.current_batch : [];
      return {
        inputs: { source: "Routing dispatch (PRD chunks + Jira chunks)" },
        outputs: {
          stories_written: stories.length,
          stories_summary: stories.map(s => ({
            story_id: s.story_id,
            user_story: s.user_story?.substring(0, 100),
            validation_status: s.validation_status,
            ac_count: s.acceptance_criteria?.length || 0,
            subtask_count: s.subtasks?.length || 0,
            story_points: s.story_points,
            has_failure: s.validation_status === "failed",
            failure_reasons: s.failure_reasons?.slice(0, 2),
          })),
        },
      };

    case "validation":
      const validated = Array.isArray(data.current_batch?._replace ? data.current_batch.items : data.current_batch) 
        ? (data.current_batch?._replace ? data.current_batch.items : data.current_batch)
        : [];
      const writtenOut = Array.isArray(data.written_stories) ? data.written_stories : [];
      return {
        inputs: { source: "Story Writer output" },
        outputs: {
          retryable_failures: validated.length,
          passed_to_assembler: writtenOut.length,
          failure_reasons_summary: validated
            .filter(s => s.failure_reasons)
            .flatMap(s => s.failure_reasons)
            .slice(0, 5),
        },
      };

    case "feedback":
      const fixed = data.current_batch?._replace ? data.current_batch.items : 
                     (Array.isArray(data.current_batch) ? data.current_batch : []);
      return {
        inputs: { source: "Validation failures" },
        outputs: {
          stories_rewritten: fixed.length,
          revision_count: data.revision_count || 0,
          rewrite_summary: fixed.map(s => ({
            story_id: s.story_id,
            status: s.validation_status,
            retry_count: s.retry_count,
          })),
        },
      };

    case "assembler":
      return {
        inputs: { source: "All validated stories" },
        outputs: {
          total_stories: data.validation_report?.total_stories,
          passed: data.validation_report?.passed,
          failed_and_flagged: data.validation_report?.failed_and_flagged,
          total_sprints: data.validation_report?.total_sprints,
          stories_per_sprint: data.validation_report?.stories_per_sprint,
          backlog_id: data.backlog_id,
        },
      };

    default:
      return { inputs: {}, outputs: {} };
  }
};

const graph = new StateGraph(StateAnnotation)
  .addNode("jira_fetch", jiraFetchNode)
  .addNode("prd_ingestion", prdIngestionNode)
  .addNode("orchestrator", orchestratorNode)
  .addNode("routing", routingNode)
  .addNode("story_writer", storyWriterNode)
  .addNode("validation", validationNode)
  .addNode("feedback", feedbackNode)
  .addNode("assembler", assemblerNode)
  .addEdge(START, "jira_fetch")
  .addEdge(START, "prd_ingestion")
  .addEdge(["jira_fetch", "prd_ingestion"], "orchestrator")
  .addEdge("orchestrator", "routing")
  .addConditionalEdges("routing", (state) => state.send_list)
  .addEdge("story_writer", "validation")
  .addConditionalEdges("validation", (state) => {
    if (state.current_batch.length > 0 && state.revision_count < 3) {
      return "feedback";
    }
    return "assembler";
  })
  .addEdge("feedback", "validation")
  .addEdge("assembler", END);

const mimoBacklogAgent = graph.compile();

const runBacklogGenerator = async (input) => {
  console.log("Starting LangGraph Backlog Generator...");

  // Reset invocation tracker
  nodeInvocations = {};

  emitAgentEvent("run_start", {
    runId: Date.now().toString(36),
    nodes: Object.keys(NODE_LABELS),
    nodeLabels: NODE_LABELS,
  });

  let result;
  try {
    const stream = await mimoBacklogAgent.stream(input, {
      streamMode: "updates",
    });

    for await (const chunk of stream) {
      // chunk is an object like { "node_name": { ...partial_state } }
      for (const nodeName of Object.keys(chunk)) {
        if (nodeName === "__interrupt__") continue;

        // Track invocation count
        nodeInvocations[nodeName] = (nodeInvocations[nodeName] || 0) + 1;

        emitAgentEvent("node_start", {
          node: nodeName,
          label: NODE_LABELS[nodeName] || nodeName,
        });

        let payload = {};
        if (nodeName === "orchestrator" && chunk[nodeName].orchestrator_contract) {
          payload.orchestrator_contract = chunk[nodeName].orchestrator_contract;
        }

        // Emit context data for observability
        const context = extractNodeContext(nodeName, chunk);
        emitAgentEvent("node_context", {
          node: nodeName,
          label: NODE_LABELS[nodeName] || nodeName,
          invocation: nodeInvocations[nodeName],
          ...context,
        });

        // Small delay so the dashboard can render start before we emit end
        await new Promise((r) => setTimeout(r, 50));
        emitAgentEvent("node_end", {
          node: nodeName,
          label: NODE_LABELS[nodeName] || nodeName,
          ...payload
        });
      }

      // Keep merging the latest chunk as result
      result = { ...(result || {}), ...Object.values(chunk).reduce((acc, v) => ({ ...acc, ...v }), {}) };
    }
  } catch (error) {
    emitAgentEvent("error", {
      message: error.message,
      node: "unknown",
    });
    throw error;
  }

  const hasFailures = result?.validation_report?.failed_and_flagged > 0;
  
  if (hasFailures) {
    emitAgentEvent("run_end", {
      success: false,
      message: `${result.validation_report.failed_and_flagged} stories failed validation.`
    });
  } else {
    emitAgentEvent("run_end", {
      success: true,
    });
  }

  return result;
};

export { mimoBacklogAgent, runBacklogGenerator };
