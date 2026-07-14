import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useSSE } from "../hooks/useSSE";
import * as scrumApi from "../api/scrum";
import * as docsApi from "../api/documents";
import type { PRDSession, BusinessDocument, Epic } from "../types";
import { normalizeEpics } from "../types";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Toggle } from "../components/ui/Toggle";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import {
  Upload,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import "./PRDPage.css";

export function PRDPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const workspace = useWorkspaceStore((s) => s.workspace);

  const [sessions, setSessions] = useState<PRDSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PRDSession | null>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState({
    includeAcceptanceCriteria: true,
    estimateStoryPoints: true,
    includeSubTasks: true,
  });
  const [businessDocs, setBusinessDocs] = useState<BusinessDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  // SSE
  const { events, connect, disconnect, clearEvents } = useSSE();

  // Output
  const [epics, setEpics] = useState<Epic[]>([]);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());

  const loadSessions = useCallback(async () => {
    try {
      const data = await scrumApi.getPRDSessions();
      setSessions(data);
    } catch {
      // silent
    }
  }, []);

  const loadSession = useCallback(async (sid: string) => {
    try {
      const s = await scrumApi.getPRDSession(sid);
      setCurrentSession(s);
      if (s.epics?.length) {
        const normalized = normalizeEpics(s.epics);
        setEpics(normalized);
        // Select all by default
        const allIds = new Set<string>();
        normalized.forEach((e) => e.stories?.forEach((st) => allIds.add(st.story_id)));
        setSelectedStories(allIds);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  useEffect(() => {
    docsApi.getDocuments(workspace?.boardId?.toString()).then(setBusinessDocs).catch(() => {});
  }, [workspace]);

  // Connect SSE when generating
  useEffect(() => {
    if (generating) {
      connect();
    }
    return () => disconnect();
  }, [generating, connect, disconnect]);

  const handleGenerate = async () => {
    if (!file) return;

    // Create session first
    const session = await scrumApi.createPRDSession({
      prompt,
      options,
    });

    setGenerating(true);
    clearEvents();

    try {
      const formData = new FormData();
      formData.append("prdFile", file);
      formData.append("sessionId", session._id);
      formData.append("projectKey", workspace?.projectKey ?? "");
      if (workspace?.boardId) {
        formData.append("boardId", String(workspace.boardId));
      }
      formData.append("prompt", prompt);
      formData.append("options", JSON.stringify(options));
      if (selectedDocIds.length) {
        formData.append("businessDocIds", JSON.stringify(selectedDocIds));
      }

      await scrumApi.generateSuggestions(formData);
      navigate(`/prd/${session._id}`);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const s = await scrumApi.getPRDSession(session._id);
          setCurrentSession(s);
          if (s.status !== "processing") {
            clearInterval(pollInterval);
            setGenerating(false);
            if (s.epics?.length) {
              const normalized = normalizeEpics(s.epics);
              setEpics(normalized);
              const allIds = new Set<string>();
              normalized.forEach((e) => e.stories?.forEach((st) => allIds.add(st.story_id)));
              setSelectedStories(allIds);
            }
          }
        } catch {
          // ignore
        }
      }, 3000);
    } catch {
      setGenerating(false);
    }
  };

  const handleNewSession = async () => {
    const session = await scrumApi.createPRDSession({ options });
    setSessions((prev) => [session, ...prev]);
    navigate(`/prd/${session._id}`);
    setFile(null);
    setPrompt("");
    setEpics([]);
    setSelectedStories(new Set());
  };

  const handleDeleteSession = async (sid: string) => {
    await scrumApi.deletePRDSession(sid);
    setSessions((prev) => prev.filter((s) => s._id !== sid));
    if (currentSession?._id === sid) {
      navigate("/prd");
    }
  };

  const toggleEpic = (epicId: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) next.delete(epicId);
      else next.add(epicId);
      return next;
    });
  };

  const toggleStory = (storyId: string) => {
    setSelectedStories((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) next.delete(storyId);
      else next.add(storyId);
      return next;
    });
  };

  const toggleAllInEpic = (epic: Epic) => {
    const allSelected = (epic.stories ?? []).every((s) => selectedStories.has(s.story_id));
    setSelectedStories((prev) => {
      const next = new Set(prev);
      (epic.stories ?? []).forEach((s) => {
        if (allSelected) next.delete(s.story_id);
        else next.add(s.story_id);
      });
      return next;
    });
  };

  const selectedCount = selectedStories.size;
  const hasOutput = epics.length > 0;

  return (
    <PageContainer className="prd-page-container">
      <div className="prd-layout">
        {/* Session List */}
        <div className="prd-sidebar">
          <div className="prd-sidebar-header">
            <h3>Sessions</h3>
            <Button size="sm" variant="ghost" icon={<Plus size={16} />} onClick={handleNewSession}>
              New
            </Button>
          </div>
          <div className="prd-sidebar-list">
            {sessions.map((s) => (
              <div
                key={s._id}
                className={`prd-sidebar-item ${currentSession?._id === s._id ? "active" : ""}`}
                onClick={() => navigate(`/prd/${s._id}`)}
              >
                <div className="prd-sidebar-item-info">
                  <span className="prd-sidebar-item-title">{s.title ?? "Untitled"}</span>
                  <Badge
                    variant={
                      s.status === "ready" ? "success" : s.status === "processing" ? "warning" : s.status === "failed" ? "error" : "default"
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
                <button
                  className="prd-sidebar-item-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(s._id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Area */}
        <div className="prd-main">
          {/* Upload Section */}
          {!hasOutput && !generating && (
            <div className="prd-upload-section">
              <div className="prd-upload-header">
                <h2>Backlog Generator</h2>
                <p>Upload a PRD document and let AI generate your Jira backlog.</p>
              </div>

              {/* File Upload */}
              <div
                className={`prd-dropzone ${file ? "prd-dropzone-active" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) setFile(f);
                }}
              >
                {file ? (
                  <div className="prd-dropzone-file">
                    <FileText size={24} />
                    <div>
                      <p className="prd-dropzone-filename">{file.name}</p>
                      <p className="prd-dropzone-filesize">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setFile(null)}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} />
                    <p>Drag & drop your PRD file here, or click to browse</p>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      className="prd-dropzone-input"
                    />
                  </>
                )}
              </div>

              {/* Business Docs */}
              {businessDocs.length > 0 && (
                <div className="prd-section">
                  <h4>Business Context Documents</h4>
                  <div className="prd-doc-list">
                    {businessDocs.map((doc) => (
                      <label key={doc._id} className="prd-doc-item">
                        <input
                          type="checkbox"
                          checked={selectedDocIds.includes(doc._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocIds((prev) => [...prev, doc._id]);
                            } else {
                              setSelectedDocIds((prev) => prev.filter((id) => id !== doc._id));
                            }
                          }}
                        />
                        <span>{doc.filename}</span>
                        <Badge
                          variant={doc.syncStatus === "SYNCED" ? "success" : doc.syncStatus === "FAILED" ? "error" : "warning"}
                        >
                          {doc.syncStatus}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Prompt */}
              <div className="prd-section">
                <h4>Custom Instructions</h4>
                <textarea
                  className="prd-prompt-input"
                  placeholder="Add any specific instructions for the AI..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Options */}
              <div className="prd-section">
                <h4>Generation Options</h4>
                <div className="prd-options">
                  <label className="prd-option">
                    <Toggle
                      checked={options.includeAcceptanceCriteria}
                      onChange={(v) => setOptions((o) => ({ ...o, includeAcceptanceCriteria: v }))}
                    />
                    <span>Include Acceptance Criteria</span>
                  </label>
                  <label className="prd-option">
                    <Toggle
                      checked={options.estimateStoryPoints}
                      onChange={(v) => setOptions((o) => ({ ...o, estimateStoryPoints: v }))}
                    />
                    <span>Estimate Story Points</span>
                  </label>
                  <label className="prd-option">
                    <Toggle
                      checked={options.includeSubTasks}
                      onChange={(v) => setOptions((o) => ({ ...o, includeSubTasks: v }))}
                    />
                    <span>Generate Sub-tasks</span>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                size="lg"
                icon={<Sparkles size={18} />}
                onClick={handleGenerate}
                disabled={!file}
                className="prd-generate-btn"
              >
                Generate Backlog
              </Button>
            </div>
          )}

          {/* Processing State */}
          {generating && (
            <div className="prd-processing">
              <div className="prd-processing-animation">
                <Loader2 size={48} className="prd-processing-spinner" />
              </div>
              <h3>Generating your backlog...</h3>
              <p>The AI is analyzing your PRD and creating user stories.</p>

              {/* SSE Events */}
              {events.length > 0 && (
                <div className="prd-events">
                  {events.slice(-5).map((event, i) => (
                    <div key={i} className="prd-event">
                      <Badge variant={event.type === "error" ? "error" : "info"}>
                        {event.node ?? event.type}
                      </Badge>
                      <span>{event.message ?? "Processing..."}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Output */}
          {hasOutput && !generating && (
            <div className="prd-output">
              <div className="prd-output-header">
                <div>
                  <h3>Generated Backlog</h3>
                  <span className="prd-output-count">
                    {epics.length} epics &middot; {epics.reduce((acc, e) => acc + (e.stories?.length ?? 0), 0)} stories
                  </span>
                </div>
                <Button
                  onClick={() => {
                    const backlogId = currentSession?.generatedBacklogId ?? currentSession?._id;
                    if (backlogId) {
                      navigate(`/backlog/review/${backlogId}`);
                    }
                  }}
                  disabled={selectedCount === 0}
                >
                  Review & Push ({selectedCount})
                </Button>
              </div>

              <div className="prd-epics">
                {epics.map((epic) => {
                  const isExpanded = expandedEpics.has(epic.epic_id);
                  const allSelected = (epic.stories ?? []).every((s) => selectedStories.has(s.story_id));
                  const someSelected = (epic.stories ?? []).some((s) => selectedStories.has(s.story_id));

                  return (
                    <div key={epic.epic_id} className="prd-epic">
                      <div className="prd-epic-header" onClick={() => toggleEpic(epic.epic_id)}>
                        <button className="prd-epic-toggle">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => toggleAllInEpic(epic)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="prd-epic-info">
                          <h4>{epic.epic_title}</h4>
                          <span>{(epic.stories ?? []).length} stories</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="prd-stories">
                          {(epic.stories ?? []).map((story) => (
                            <div key={story.story_id} className="prd-story-group">
                              <div className="prd-story">
                                <input
                                  type="checkbox"
                                  checked={selectedStories.has(story.story_id)}
                                  onChange={() => toggleStory(story.story_id)}
                                />
                                <div className="prd-story-info">
                                  <p className="prd-story-title">{story.user_story}</p>
                                  <div className="prd-story-meta">
                                    <Badge variant="default">{story.priority}</Badge>
                                    {story.story_points > 0 && (
                                      <Badge variant="info">{story.story_points} pts</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {story.subtasks && story.subtasks.length > 0 && (
                                <div className="prd-subtasks">
                                  {story.subtasks.map((sub) => (
                                    <div key={sub.task_id} className="prd-subtask">
                                      <span className="prd-subtask-bullet" />
                                      <span>{sub.task_title}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state when no session selected */}
          {!sessionId && !generating && !hasOutput && (
            <div className="prd-empty">
              <EmptyState
                icon={<FileText size={48} />}
                title="Select or create a session"
                description="Choose an existing session from the sidebar or create a new one to get started."
                action={
                  <Button onClick={handleNewSession} icon={<Plus size={16} />}>
                    New Session
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
