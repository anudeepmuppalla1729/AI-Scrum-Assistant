import { useState } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import {
  ChevronDown,
  ChevronRight,
  Send,
  ExternalLink,
  Link2,
  Search,
  CheckCircle2,
} from "lucide-react";
import * as scrumApi from "../../api/scrum";
import { useWorkspaceStore } from "../../store/useWorkspaceStore";
import "./BacklogCard.css";

interface BacklogItem {
  type: string;
  summary: string;
  description?: string;
  acceptanceCriteria?: string[];
  priority?: string;
  storyPoints?: number;
  parentKey?: string;
  parentSummary?: string;
}

interface Props {
  item: BacklogItem;
  sessionId?: string | null;
}

const TYPE_COLORS: Record<string, "primary" | "success" | "info" | "default"> = {
  Epic: "primary",
  Story: "success",
  Task: "info",
  Subtask: "default",
};

const PRIORITY_COLORS: Record<string, "error" | "warning" | "default"> = {
  Highest: "error",
  High: "error",
  Medium: "warning",
  Low: "default",
  Lowest: "default",
};

export function BacklogCard({ item: initialItem, sessionId }: Props) {
  const [item, setItem] = useState(initialItem);
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState({ ...initialItem });
  const [isExpanded, setIsExpanded] = useState(true);
  const [pushed, setPushed] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ jiraKey: string; jiraUrl: string } | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [showParentSearch, setShowParentSearch] = useState(false);
  const [parentQuery, setParentQuery] = useState("");
  const [parentResults, setParentResults] = useState<Array<{ key: string; summary: string }>>([]);
  const [searchingParents, setSearchingParents] = useState(false);

  const workspace = useWorkspaceStore((s) => s.workspace);

  const handlePush = async () => {
    if (!workspace?.projectKey) return;
    setPushing(true);
    setPushError(null);
    try {
      const res = await scrumApi.pushBacklogItem({
        projectKey: workspace.projectKey,
        sessionId: sessionId ?? undefined,
        item: {
          summary: item.summary,
          type: item.type,
          description: item.description,
          priority: item.priority,
          storyPoints: item.storyPoints,
          parentKey: item.parentKey,
          acceptanceCriteria: item.acceptanceCriteria,
        },
      });
      setPushed(true);
      setPushResult({ jiraKey: res.jiraKey, jiraUrl: res.jiraUrl });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to push";
      setPushError(msg);
    } finally {
      setPushing(false);
    }
  };

  const handleParentSearch = async () => {
    if (!workspace?.projectKey || !parentQuery.trim()) return;
    setSearchingParents(true);
    try {
      const results = await scrumApi.searchBacklog(workspace.projectKey, parentQuery);
      setParentResults(results);
    } catch {
      // silent
    } finally {
      setSearchingParents(false);
    }
  };

  const handleLinkParent = (key: string, summary: string) => {
    setItem((prev) => ({ ...prev, parentKey: key, parentSummary: summary }));
    setShowParentSearch(false);
    setParentQuery("");
    setParentResults([]);
  };

  const handleSaveEdit = () => {
    setItem({ ...editState });
    setIsEditing(false);
  };

  return (
    <div className="backlog-card">
      {/* Header */}
      <div className="backlog-card-header" onClick={() => setIsExpanded(!isExpanded)}>
        <button className="backlog-card-toggle">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <Badge variant={TYPE_COLORS[item.type] ?? "default"}>{item.type}</Badge>
        <span className="backlog-card-summary">{item.summary}</span>
        {item.priority && (
          <Badge variant={PRIORITY_COLORS[item.priority] ?? "default"}>{item.priority}</Badge>
        )}
        {pushed && pushResult && (
          <Badge variant="success">
            <CheckCircle2 size={12} /> {pushResult.jiraKey}
          </Badge>
        )}
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="backlog-card-body">
          {isEditing ? (
            <div className="backlog-card-edit">
              <Input
                label="Summary"
                value={editState.summary}
                onChange={(e) => setEditState((s) => ({ ...s, summary: e.target.value }))}
              />
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  className="input textarea"
                  value={editState.description ?? ""}
                  onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="backlog-card-edit-row">
                <div className="input-group">
                  <label className="input-label">Priority</label>
                  <select
                    className="input"
                    value={editState.priority ?? "Medium"}
                    onChange={(e) => setEditState((s) => ({ ...s, priority: e.target.value }))}
                  >
                    <option value="Highest">Highest</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Lowest">Lowest</option>
                  </select>
                </div>
                <Input
                  label="Story Points"
                  type="number"
                  value={editState.storyPoints ?? 0}
                  onChange={(e) => setEditState((s) => ({ ...s, storyPoints: Number(e.target.value) }))}
                  min={0}
                  max={13}
                />
              </div>
              <div className="backlog-card-edit-actions">
                <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              {/* Description */}
              {item.description && (
                <p className="backlog-card-desc">{item.description}</p>
              )}

              {/* Acceptance Criteria */}
              {item.acceptanceCriteria && item.acceptanceCriteria.length > 0 && (
                <div className="backlog-card-ac">
                  <span className="backlog-card-ac-label">Acceptance Criteria</span>
                  <ul className="backlog-card-ac-list">
                    {item.acceptanceCriteria.map((ac, i) => (
                      <li key={i}>{ac}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meta */}
              <div className="backlog-card-meta">
                {item.storyPoints != null && item.storyPoints > 0 && (
                  <Badge variant="info">{item.storyPoints} pts</Badge>
                )}
                {item.parentKey && (
                  <span className="backlog-card-parent">
                    <Link2 size={12} /> {item.parentKey}: {item.parentSummary}
                  </span>
                )}
              </div>

              {/* Parent Search */}
              {showParentSearch && (
                <div className="backlog-card-parent-search">
                  <div className="backlog-card-parent-search-row">
                    <Input
                      placeholder="Search Jira issues..."
                      value={parentQuery}
                      onChange={(e) => setParentQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleParentSearch()}
                    />
                    <Button size="sm" icon={<Search size={14} />} onClick={handleParentSearch} loading={searchingParents}>
                      Search
                    </Button>
                  </div>
                  {parentResults.length > 0 && (
                    <div className="backlog-card-parent-results">
                      {parentResults.map((r) => (
                        <button
                          key={r.key}
                          className="backlog-card-parent-result"
                          onClick={() => handleLinkParent(r.key, r.summary)}
                        >
                          <span className="backlog-card-parent-key">{r.key}</span>
                          <span>{r.summary}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="backlog-card-actions">
                {!pushed && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowParentSearch(!showParentSearch)}>
                      <Link2 size={14} /> Link Parent
                    </Button>
                    <Button size="sm" icon={<Send size={14} />} onClick={handlePush} loading={pushing}>
                      Push to Jira
                    </Button>
                  </>
                )}
                {pushed && pushResult && (
                  <a href={pushResult.jiraUrl} target="_blank" rel="noopener noreferrer" className="backlog-card-link">
                    View in Jira <ExternalLink size={14} />
                  </a>
                )}
              </div>

              {/* Error */}
              {pushError && (
                <div className="backlog-card-error">{pushError}</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
