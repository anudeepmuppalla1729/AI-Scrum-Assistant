import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import * as scrumApi from "../api/scrum";
import type { GeneratedBacklog, Story } from "../types";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import {
  ChevronDown,
  ChevronRight,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  Save,
  X,
} from "lucide-react";
import "./BacklogReviewPage.css";

export function BacklogReviewPage() {
  const { id } = useParams();
  const [backlog, setBacklog] = useState<GeneratedBacklog | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [editingStory, setEditingStory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Story>>({});
  const [pushing, setPushing] = useState(false);

  const loadBacklog = useCallback(async () => {
    if (!id) return;
    try {
      const data = await scrumApi.getGeneratedBacklog(id);
      setBacklog(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBacklog();
  }, [loadBacklog]);

  // Poll when pushing
  useEffect(() => {
    if (!pushing) return;
    const interval = setInterval(async () => {
      await loadBacklog();
      const hasPushing = backlog?.epic_statuses?.some((s) => s.status === "pushing");
      if (!hasPushing) {
        setPushing(false);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pushing, backlog, loadBacklog]);

  const toggleEpic = (epicId: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(epicId)) next.delete(epicId);
      else next.add(epicId);
      return next;
    });
  };

  const handlePushAll = async () => {
    if (!id) return;
    setPushing(true);
    try {
      await scrumApi.approveAndPush(id);
    } catch {
      // silent
    }
  };

  const handlePushEpic = async (epicId: string) => {
    if (!id) return;
    setPushing(true);
    try {
      await scrumApi.approveAndPush(id, epicId);
    } catch {
      // silent
    }
  };

  const handleStartEdit = (story: Story) => {
    setEditingStory(story.story_id);
    setEditForm({
      user_story: story.user_story,
      description: story.description,
      priority: story.priority,
      story_points: story.story_points,
    });
  };

  const handleSaveEdit = async (storyId: string) => {
    if (!id) return;
    try {
      await scrumApi.updateStory(id, storyId, editForm);
      await loadBacklog();
    } catch {
      // silent
    }
    setEditingStory(null);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="backlog-loading">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  if (!backlog) {
    return (
      <PageContainer>
        <EmptyState title="Backlog not found" description="This backlog doesn't exist or has been deleted." />
      </PageContainer>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawContract = backlog.orchestrator_contract as any;
  const rawEpics: Array<{ id: string; title: string; description?: string }> = rawContract?.epics ?? [];
  const epics = rawEpics.map((e) => ({
    epic_id: e.id,
    epic_title: e.title,
    epic_description: e.description,
  }));
  const storiesByEpic = new Map<string, Story[]>();
  (backlog.stories ?? []).forEach((story) => {
    const list = storiesByEpic.get(story.epic_id) ?? [];
    list.push(story);
    storiesByEpic.set(story.epic_id, list);
  });

  return (
    <PageContainer>
      <div className="backlog-review">
        <div className="backlog-header">
          <div>
            <h1>Review Backlog</h1>
            <p className="backlog-subtitle">
              {epics.length} epics &middot; {backlog.stories.length} stories
            </p>
          </div>
          <Button
            icon={<Send size={16} />}
            onClick={handlePushAll}
            loading={pushing}
            disabled={backlog.status === "fully_pushed"}
          >
            Push All to Jira
          </Button>
        </div>

        {/* Validation Report */}
        {backlog.validation_report && (
          <div className="backlog-validation card">
            <div className="backlog-validation-stat">
              <CheckCircle2 size={16} />
              <span>{backlog.validation_report.passed} passed</span>
            </div>
            <div className="backlog-validation-stat">
              <AlertCircle size={16} />
              <span>{backlog.validation_report.failed} failed</span>
            </div>
          </div>
        )}

        {/* Epics */}
        <div className="backlog-epics">
          {epics.map((epic) => {
            const epicStatus = backlog.epic_statuses?.find((s) => s.epic_id === epic.epic_id);
            const stories = storiesByEpic.get(epic.epic_id) ?? [];
            const isExpanded = expandedEpics.has(epic.epic_id);

            return (
              <div key={epic.epic_id} className="backlog-epic card">
                <div className="backlog-epic-header" onClick={() => toggleEpic(epic.epic_id)}>
                  <button className="backlog-epic-toggle">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <div className="backlog-epic-info">
                    <h3>{epic.epic_title}</h3>
                    <span>{stories.length} stories</span>
                  </div>
                  <div className="backlog-epic-actions">
                    {epicStatus && (
                      <Badge
                        variant={
                          epicStatus.status === "pushed" ? "success" :
                          epicStatus.status === "pushing" ? "warning" :
                          epicStatus.status === "failed" ? "error" :
                          "default"
                        }
                      >
                        {epicStatus.status === "pushing" && <Loader2 size={12} className="badge-spinner" />}
                        {epicStatus.status}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Send size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePushEpic(epic.epic_id);
                      }}
                      disabled={epicStatus?.status === "pushed" || pushing}
                    >
                      Push
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="backlog-stories">
                    {stories.map((story) => {
                      const isEditing = editingStory === story.story_id;

                      return (
                        <div key={story.story_id} className="backlog-story">
                          {isEditing ? (
                            <div className="backlog-story-edit">
                              <textarea
                                className="backlog-story-edit-input"
                                value={editForm.user_story ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, user_story: e.target.value }))}
                                rows={2}
                              />
                              <textarea
                                className="backlog-story-edit-input"
                                value={editForm.description ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                rows={3}
                                placeholder="Description"
                              />
                              <div className="backlog-story-edit-row">
                                <select
                                  value={editForm.priority ?? "Medium"}
                                  onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value as Story["priority"] }))}
                                >
                                  <option value="High">High</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Low">Low</option>
                                </select>
                                <input
                                  type="number"
                                  value={editForm.story_points ?? 0}
                                  onChange={(e) => setEditForm((f) => ({ ...f, story_points: Number(e.target.value) }))}
                                  min={0}
                                  max={13}
                                  placeholder="Points"
                                />
                              </div>
                              <div className="backlog-story-edit-actions">
                                <Button size="sm" icon={<Save size={14} />} onClick={() => handleSaveEdit(story.story_id)}>
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" icon={<X size={14} />} onClick={() => setEditingStory(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="backlog-story-content">
                                <p className="backlog-story-title">{story.user_story}</p>
                                <p className="backlog-story-desc">{story.description}</p>
                                <div className="backlog-story-meta">
                                  <Badge
                                    variant={
                                      story.priority === "High" ? "error" :
                                      story.priority === "Medium" ? "warning" :
                                      "default"
                                    }
                                  >
                                    {story.priority}
                                  </Badge>
                                  {story.story_points > 0 && (
                                    <Badge variant="info">{story.story_points} pts</Badge>
                                  )}
                                  {story.validation_status === "fail" && (
                                    <Badge variant="error">Validation Failed</Badge>
                                  )}
                                </div>
                                {/* Subtasks */}
                                {story.subtasks && story.subtasks.length > 0 && (
                                  <div className="backlog-subtasks">
                                    <span className="backlog-subtasks-label">Subtasks</span>
                                    {story.subtasks.map((sub: { title?: string; task_title?: string }, i) => (
                                      <div key={i} className="backlog-subtask">
                                        <span className="backlog-subtask-bullet" />
                                        <span>{sub.title ?? sub.task_title ?? ""}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                icon={<Edit3 size={14} />}
                                onClick={() => handleStartEdit(story)}
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
