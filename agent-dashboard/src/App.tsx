import { useState, useEffect, useRef, useCallback } from "react";
import {
  Link,
  FileText,
  BrainCircuit,
  Waypoints,
  PenTool,
  ShieldCheck,
  RefreshCw,
  PackageCheck,
  Play,
  CheckCircle,
  AlertCircle,
  Activity,
  Check,
  X,
  Zap,
  PartyPopper,
  AlertTriangle
} from "lucide-react";
import "./index.css";

/* =============================================
   Types
   ============================================= */
interface AgentEvent {
  type:
    | "connected"
    | "heartbeat"
    | "run_start"
    | "run_end"
    | "node_start"
    | "node_end"
    | "node_context"
    | "model_download"
    | "error";
  timestamp: string;
  node?: string;
  label?: string;
  message?: string;
  nodes?: string[];
  nodeLabels?: Record<string, string>;
  success?: boolean;
  runId?: string;
  orchestrator_contract?: any;
  inputs?: any;
  outputs?: any;
  invocation?: number;
  file?: string;
  status?: string;
  progress?: number;
  totalProgress?: number;
}

type NodeStatus = "waiting" | "ready" | "active" | "completed" | "errored";

interface NodeState {
  id: string;
  label: string;
  icon: any;
  status: NodeStatus;
  revisions: number;
}

/* =============================================
   Constants
   ============================================= */
const DEFAULT_NODES: NodeState[] = [
  { id: "jira_fetch", label: "Jira Context", icon: Link, status: "waiting", revisions: 0 },
  { id: "prd_ingestion", label: "PRD Ingestion", icon: FileText, status: "waiting", revisions: 0 },
  { id: "orchestrator", label: "Orchestrator", icon: BrainCircuit, status: "waiting", revisions: 0 },
  { id: "routing", label: "Routing", icon: Waypoints, status: "waiting", revisions: 0 },
  { id: "story_writer", label: "Story Writer", icon: PenTool, status: "waiting", revisions: 0 },
  { id: "validation", label: "Validation", icon: ShieldCheck, status: "waiting", revisions: 0 },
  { id: "feedback", label: "Feedback", icon: RefreshCw, status: "waiting", revisions: 0 },
  { id: "assembler", label: "Assembler", icon: PackageCheck, status: "waiting", revisions: 0 },
];

const EVENT_ICONS: Record<string, any> = {
  node_start: Play,
  node_end: Check,
  run_start: Activity,
  run_end: CheckCircle,
  error: AlertCircle,
  heartbeat: Activity,
  connected: Zap,
};

/* =============================================
   SSE URL
   ============================================= */
const API_BASE = import.meta.env.VITE_API_URL || "";
const SSE_URL = `${API_BASE}/api/v1/events/agent-status`;

/* =============================================
   App Component
   ============================================= */
function App() {
  const [connected, setConnected] = useState(false);
  const [nodes, setNodes] = useState<NodeState[]>(DEFAULT_NODES);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [nodeContexts, setNodeContexts] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState<"pipeline" | "context" | "dataflow">("pipeline");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<
    "idle" | "running" | "completed" | "errored"
  >("idle");
  const [blueprint, setBlueprint] = useState<any>(null);
  const [modelDownload, setModelDownload] = useState<{file?: string, status?: string, progress?: number, totalProgress?: number} | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Derived metrics
  const feedbackCount = events.filter((e) => e.type === "node_start" && e.node === "feedback").length;
  const errorCount = events.filter((e) => e.type === "error" || (e.type === "node_end" && e.success === false)).length;
  const activeNode = nodes.find((n) => n.status === "active");

  // Auto-scroll event log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const handleEvent = useCallback((event: AgentEvent) => {
    // Skip heartbeats from event log (too noisy)
    if (event.type !== "heartbeat") {
      setEvents((prev) => {
        // Prevent duplicate replayed events by checking timestamp and type (basic heuristic)
        if (prev.find(e => e.timestamp === event.timestamp && e.type === event.type && e.node === event.node)) {
            return prev;
        }
        return [...prev, event];
      });
    }

    switch (event.type) {
      case "connected":
        setConnected(true);
        break;

      case "run_start":
        setRunStatus("running");
        setEvents((prev) => [event]); // Clear old events on new run
        setBlueprint(null); // Clear blueprint on new run
        setNodeContexts({}); // Clear contexts on new run
        setNodes(DEFAULT_NODES.map(n => ({
          ...n,
          label: event.nodeLabels?.[n.id] || n.label,
        })));
        break;

      case "node_context":
        if (event.node) {
          setNodeContexts(prev => {
            const current = prev[event.node!] || [];
            // Prevent duplicates
            if (current.find(c => c.timestamp === event.timestamp && c.invocation === event.invocation)) {
                return prev;
            }
            return {
              ...prev,
              [event.node!]: [...current, {
                inputs: event.inputs,
                outputs: event.outputs,
                timestamp: event.timestamp,
                invocation: event.invocation
              }]
            };
          });
        }
        break;

      case "node_start":
        if (event.node) {
          setNodes((prev) => {
            const nodeIndex = prev.findIndex(n => n.id === event.node);
            if (nodeIndex === -1) return prev;
            return prev.map((n, i) => {
              if (i === nodeIndex) {
                // If the node was already completed, this is a revision loop!
                return { ...n, status: "active", revisions: n.status === "completed" ? n.revisions + 1 : n.revisions };
              }
              // Don't reset downstream nodes — the graph topology is not strictly linear.
              // Feedback→Validation loops should not reset assembler, etc.
              return n;
            });
          });
        }
        break;

      case "node_end":
        if (event.node) {
          if (event.orchestrator_contract) {
            setBlueprint(event.orchestrator_contract);
          }
          setNodes((prev) => {
            const nodeIndex = prev.findIndex(n => n.id === event.node);
            return prev.map((n, i) => {
              if (i === nodeIndex) {
                return { ...n, status: "completed" };
              }
              // Only mark next node as ready if it's still waiting (never regress completed/active)
              if (i === nodeIndex + 1 && n.status === "waiting") {
                return { ...n, status: "ready" };
              }
              return n;
            });
          });
        }
        break;

      case "run_end":
        setRunStatus(event.success !== false ? "completed" : "errored");
        break;

      case "error":
        if (event.node && event.node !== "unknown") {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === event.node
                ? { ...n, status: "errored" }
                : n
            )
          );
        }
        setRunStatus("errored");
        break;
      
      case "model_download":
        setModelDownload({
          file: event.file,
          status: event.status,
          progress: event.progress,
          totalProgress: event.totalProgress
        });
        if (event.status === "ready" || event.totalProgress === 100) {
          setTimeout(() => setModelDownload(null), 5000); // hide after 5 seconds
        }
        break;
    }
  }, []);

  // SSE Connection
  useEffect(() => {
    const connect = () => {
      const es = new EventSource(SSE_URL);
      eventSourceRef.current = es;

      es.onmessage = (msg) => {
        try {
          const data: AgentEvent = JSON.parse(msg.data);
          handleEvent(data);
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Retry after 3s
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [handleEvent]);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  const getEventText = (ev: AgentEvent): string => {
    switch (ev.type) {
      case "connected":
        return "Connected to event stream";
      case "run_start":
        return "Pipeline initialized";
      case "run_end":
        return ev.success !== false ? "Pipeline completed successfully" : "Pipeline finished with errors";
      case "node_start":
        return `Agent Started: ${ev.label || ev.node}`;
      case "node_end":
        return `Agent Finished: ${ev.label || ev.node}`;
      case "error":
        return `Error: ${ev.message || "Unknown error"}`;
      default:
        return ev.type;
    }
  };

  const runBannerConfig = {
    idle: {
      icon: <Activity size={28} />,
      title: "Waiting for pipeline",
      subtitle: "No active generation. Start a backlog generation from the main app.",
      style: "bg-surface text-secondary"
    },
    running: {
      icon: <Zap size={28} />,
      title: "Pipeline is running",
      subtitle: "LangGraph agents are processing your PRD in real-time.",
      style: "bg-accent-subtle text-accent"
    },
    completed: {
      icon: <PartyPopper size={28} />,
      title: "Pipeline completed",
      subtitle: "All agents finished successfully. Results are ready.",
      style: "bg-success-subtle text-success"
    },
    errored: {
      icon: <AlertTriangle size={28} />,
      title: "Pipeline encountered an error",
      subtitle: "Check the event log below for details.",
      style: "bg-error-subtle text-error"
    },
  };

  const banner = runBannerConfig[runStatus];
  const row1 = nodes.slice(0, 4);
  const row2 = nodes.slice(4, 8);

  return (
    <div className="monitor-shell">
      {/* ---- Top Ribbon ---- */}
      <header className="top-ribbon">
        <div className="ribbon-left">
          <div className="ribbon-logo">
            <BrainCircuit size={22} color="white" />
          </div>
          <div>
            <div className="ribbon-title">Agent Pipeline Dashboard</div>
            <div className="ribbon-subtitle">Real-time LangGraph execution tracker</div>
          </div>
        </div>
        <div className="ribbon-right">
          <div className={`conn-badge ${connected ? "connected" : "disconnected"}`}>
            <div className="conn-dot" />
            {connected ? "Live Connection" : "Disconnected"}
          </div>
        </div>
      </header>

      {/* ---- Model Download Progress ---- */}
      {modelDownload && (
        <div className="model-download-bar" style={{ padding: "12px 24px", backgroundColor: "var(--bg-accent-subtle)", color: "var(--text-accent)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "16px" }}>
          <Activity size={20} className="animate-pulse" />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
              <span>Loading AI Model... {modelDownload.file ? `(${modelDownload.file})` : ''}</span>
              <span>{Math.round(modelDownload.totalProgress || 0)}%</span>
            </div>
            <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-surface)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(0, Math.min(100, modelDownload.totalProgress || 0))}%`, height: "100%", backgroundColor: "var(--text-accent)", transition: "width 0.2s ease-out" }} />
            </div>
          </div>
        </div>
      )}

      {/* ---- Main Content ---- */}
      <main className="main-content">
        
        {/* Run Status Banner */}
        <div className={`run-banner ${runStatus}`}>
          <div className="run-banner-icon">{banner.icon}</div>
          <div className="run-banner-text">
            <h2>{banner.title}</h2>
            <p>{banner.subtitle}</p>
          </div>
        </div>

        {/* Dashboard Metrics Grid */}
        <div className="metrics-grid">
            <div className="metric-card">
                <p className="metric-label">Active Agent</p>
                <p className="metric-value accent">{activeNode ? activeNode.label : (runStatus === 'idle' ? 'None' : 'Idle')}</p>
            </div>
            <div className="metric-card">
                <p className="metric-label">Status</p>
                <p className="metric-value" style={{ textTransform: 'capitalize' }}>{runStatus}</p>
            </div>
            <div className="metric-card">
                <p className="metric-label">Quality Revisions</p>
                <p className="metric-value purple">{feedbackCount} {feedbackCount === 3 ? '(Max)' : ''}</p>
            </div>
            <div className="metric-card">
                <p className="metric-label">Errors Caught</p>
                <p className={`metric-value ${errorCount > 0 ? 'error' : 'success'}`}>{errorCount}</p>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>
            <Waypoints size={16} /> Pipeline View
          </button>
          <button className={`tab-btn ${activeTab === 'context' ? 'active' : ''}`} onClick={() => setActiveTab('context')}>
            <BrainCircuit size={16} /> Context Inspector
          </button>
          <button className={`tab-btn ${activeTab === 'dataflow' ? 'active' : ''}`} onClick={() => setActiveTab('dataflow')}>
            <Activity size={16} /> Data Flow Timeline
          </button>
        </div>

        {activeTab === 'pipeline' && (
          <>
            {/* Pipeline Flow */}
            <div>
              <div className="pipeline-section-label">Agent Topology</div>
              <div className="pipeline-rows">
                {/* Row 1 */}
                <div className="pipeline-row">
                  {row1.map((node) => {
                    const Icon = node.icon;
                    return (
                    <div className="pipeline-node cursor-pointer" key={node.id} onClick={() => { setActiveTab('context'); setSelectedNodeId(node.id); }}>
                      <div className={`node-circle ${node.status}`}>
                        {node.status === "completed" ? <Check size={26} /> : node.status === "errored" ? <X size={26} /> : <Icon size={26} />}
                        {node.revisions > 0 && (
                          <div className="node-revision-badge">{node.revisions}</div>
                        )}
                      </div>
                      <div className="node-label">{node.label}</div>
                      <div className={`node-status-tag ${node.status}`}>{node.status}</div>
                    </div>
                  )})}
                </div>
                <div className="row-connector"><div className="row-connector-line" /></div>
                {/* Row 2 */}
                <div className="pipeline-row">
                  {row2.map((node) => {
                    const Icon = node.icon;
                    return (
                    <div className="pipeline-node cursor-pointer" key={node.id} onClick={() => { setActiveTab('context'); setSelectedNodeId(node.id); }}>
                      <div className={`node-circle ${node.status}`}>
                        {node.status === "completed" ? <Check size={26} /> : node.status === "errored" ? <X size={26} /> : <Icon size={26} />}
                        {node.revisions > 0 && (
                          <div className="node-revision-badge">{node.revisions}</div>
                        )}
                      </div>
                      <div className="node-label">{node.label}</div>
                      <div className={`node-status-tag ${node.status}`}>{node.status}</div>
                    </div>
                  )})}
                </div>
              </div>
            </div>

            {/* Orchestrator Blueprint */}
            {blueprint && (
              <div className="blueprint-section">
                <div className="pipeline-section-label">Orchestrator Blueprint</div>
                <div className="blueprint-container">
                  {blueprint.epics?.map((epic: any) => (
                    <div key={epic.id} className="epic-card">
                      <div className="epic-header">
                        <div className="epic-title-row">
                          <div className="epic-badge">{epic.priority}</div>
                          <h4>{epic.title}</h4>
                        </div>
                        <p className="epic-goal">{epic.business_goal}</p>
                      </div>
                      
                      <div className="story-list">
                        {epic.stories?.map((story: any, idx: number) => (
                          <div key={story.id} className="story-item">
                            <div className="story-index">{idx + 1}</div>
                            <div className="story-content">
                              <span className="story-title">{story.title}</span>
                              <span className="story-points">
                                {story.points_hint === "needs_splitting" ? "Split" : `${story.points_hint} pts`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'context' && (
          <div className="context-inspector">
            <div className="context-sidebar">
              <h3 className="context-sidebar-title">Agents</h3>
              <div className="context-node-list">
                {DEFAULT_NODES.map(node => (
                  <button 
                    key={node.id} 
                    className={`context-node-btn ${selectedNodeId === node.id ? 'active' : ''}`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <node.icon size={16} />
                    <span>{node.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="context-content">
              {!selectedNodeId ? (
                <div className="context-empty">Select an agent to view its context data</div>
              ) : !nodeContexts[selectedNodeId] || nodeContexts[selectedNodeId].length === 0 ? (
                <div className="context-empty">No context data available for this agent yet.</div>
              ) : (
                <div className="context-scroll-area">
                  {nodeContexts[selectedNodeId].map((ctx, idx) => (
                    <div key={idx} className="context-card">
                      <div className="context-card-header">
                        <h4>Invocation {ctx.invocation}</h4>
                        <span className="context-time">{formatTime(ctx.timestamp)}</span>
                      </div>
                      
                      <div className="context-grid">
                        <div className="context-box inputs">
                          <h5>Inputs received</h5>
                          <pre>{JSON.stringify(ctx.inputs, null, 2)}</pre>
                        </div>
                        <div className="context-box outputs">
                          <h5>Outputs produced</h5>
                          <pre>{JSON.stringify(ctx.outputs, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dataflow' && (
          <div className="dataflow-section">
            <div className="pipeline-section-label">Agent Execution Timeline</div>
            <div className="dataflow-timeline">
              {Object.entries(nodeContexts).flatMap(([nodeId, contexts]) => 
                contexts.map(ctx => ({ nodeId, ...ctx }))
              ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .map((ctx, idx) => {
                const node = DEFAULT_NODES.find(n => n.id === ctx.nodeId);
                const Icon = node?.icon || Activity;
                return (
                  <div key={idx} className="dataflow-row">
                    <div className="dataflow-icon"><Icon size={16} /></div>
                    <div className="dataflow-details">
                      <div className="dataflow-header">
                        <span className="dataflow-node-name">{node?.label || ctx.nodeId}</span>
                        <span className="dataflow-time">{formatTime(ctx.timestamp)}</span>
                      </div>
                      <div className="dataflow-stats">
                        <span className="dataflow-stat">Inputs: {Object.keys(ctx.inputs || {}).length} keys</span>
                        <span className="dataflow-stat">Outputs: {Object.keys(ctx.outputs || {}).length} keys</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(nodeContexts).length === 0 && (
                <div className="event-log-empty">No execution data recorded yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Event Log */}
        <div className="event-log-section">
          <div className="event-log-header">
            <h3>Live Event Stream</h3>
            <div className="event-count-badge">
              {events.length} event{events.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="event-log-list">
            {events.length === 0 ? (
              <div className="event-log-empty">
                Waiting for agent events...
              </div>
            ) : (
              events.map((ev, i) => {
                const Icon = EVENT_ICONS[ev.type] || Activity;
                return (
                <div className="event-item" key={i}>
                  <div className={`event-icon ${ev.type}`}>
                    <Icon size={14} />
                  </div>
                  <div className="event-text">{getEventText(ev)}</div>
                  <div className="event-time">{formatTime(ev.timestamp)}</div>
                </div>
              )})
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
