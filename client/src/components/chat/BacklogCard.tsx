import React, { useState, useEffect } from "react";
import type { BacklogItem, PushedBacklogRecord } from "../../types/chat.types";
import { pushBacklogItem, searchBacklog } from "../../api/backlogApi";
import { useWorkspaceStore } from "../../store/useWorkspaceStore";

interface BacklogCardProps {
  item: BacklogItem;
  sessionId?: string | null;
  pushedSessionItems?: PushedBacklogRecord[];
  onPushed?: (jiraKey: string, jiraUrl: string) => void;
}

const TYPE_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; icon: string }
> = {
  Epic: {
    color: "text-[var(--color-purple)]",
    bg: "bg-[var(--color-purple-subtle)]",
    border: "border-[var(--color-purple-light)]",
    icon: "⚡",
  },
  Story: {
    color: "text-[var(--color-success)]",
    bg: "bg-[var(--color-success-subtle)]",
    border: "border-[var(--color-success-light)]",
    icon: "📖",
  },
  Task: {
    color: "text-[var(--color-info)]",
    bg: "bg-[var(--color-info-subtle)]",
    border: "border-[var(--color-info-light)]",
    icon: "✅",
  },
  Subtask: {
    color: "text-[var(--color-text-secondary)]",
    bg: "bg-[var(--color-bg-secondary)]",
    border: "border-[var(--color-border-light)]",
    icon: "📋",
  },
};

const PRIORITY_CONFIG: Record<string, { color: string; icon: string }> = {
  Highest: { color: "text-[var(--color-error)]", icon: "🔴" },
  High: { color: "text-[var(--color-warning)]", icon: "🟠" },
  Medium: { color: "text-[var(--color-warning)]", icon: "🟡" },
  Low: { color: "text-[var(--color-info)]", icon: "🔵" },
  Lowest: { color: "text-[var(--color-text-tertiary)]", icon: "⚪" },
};

const BacklogCard: React.FC<BacklogCardProps> = ({
  item: initialItem,
  sessionId,
  pushedSessionItems = [],
  onPushed,
}) => {
  // Check if this item is already in push history by matching summary and type
  const matchingHistoryItem = pushedSessionItems.find(
    (p) => p.summary === initialItem.summary && p.type === initialItem.type
  );

  const [item, setItem] = useState<BacklogItem>({ 
    ...initialItem,
    parentKey: matchingHistoryItem?.parentKey || initialItem.parentKey,
    parentSummary: matchingHistoryItem?.parentSummary || initialItem.parentSummary
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<BacklogItem>({ ...item });
  const [pushed, setPushed] = useState(!!matchingHistoryItem);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{
    jiraKey: string;
    jiraUrl: string;
  } | null>(matchingHistoryItem ? { jiraKey: matchingHistoryItem.jiraKey, jiraUrl: matchingHistoryItem.jiraUrl || "" } : null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [showParentSearch, setShowParentSearch] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const [parentSearchResults, setParentSearchResults] = useState<
    Array<{ key: string; summary: string; type: string; status: string }>
  >([]);
  const [searchingParents, setSearchingParents] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const workspace = useWorkspaceStore((s) => s.workspace);
  const projectKey = workspace?.projectKey;
  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.Task;

  // React to updates in pushedSessionItems
  useEffect(() => {
    const matched = pushedSessionItems.find(
      (p) => p.summary === item.summary && p.type === item.type
    );
    if (matched && !pushed) {
      setPushed(true);
      setPushResult({ jiraKey: matched.jiraKey, jiraUrl: matched.jiraUrl || "" });
      if (!item.parentKey && matched.parentKey) {
        setItem((prev) => ({ ...prev, parentKey: matched.parentKey, parentSummary: matched.parentSummary }));
      }
    }
  }, [pushedSessionItems, item.summary, item.type, item.parentKey, pushed]);

  const handlePush = async () => {
    if (!projectKey) {
      setPushError("No project selected. Please select a workspace first.");
      return;
    }

    setPushing(true);
    setPushError(null);

    try {
      const result = await pushBacklogItem(
        projectKey,
        item,
        sessionId || undefined
      );
      setPushed(true);
      setPushResult({ jiraKey: result.jiraKey, jiraUrl: result.jiraUrl });
      onPushed?.(result.jiraKey, result.jiraUrl);
    } catch (err: any) {
      setPushError(err.message || "Failed to push to Jira");
    } finally {
      setPushing(false);
    }
  };

  const handleSearchParents = async () => {
    if (!projectKey) return;
    setSearchingParents(true);
    try {
      const issueType = item.type === "Story" || item.type === "Task" ? "Epic" : undefined;
      const results = await searchBacklog(
        projectKey,
        parentSearchQuery || undefined,
        issueType
      );
      setParentSearchResults(results);
    } catch {
      setParentSearchResults([]);
    } finally {
      setSearchingParents(false);
    }
  };

  const handleSelectParent = (parent: {
    key: string;
    summary: string;
    type: string;
  }) => {
    setItem((prev) => ({
      ...prev,
      parentKey: parent.key,
      parentSummary: parent.summary,
    }));
    setEditState((prev) => ({
      ...prev,
      parentKey: parent.key,
      parentSummary: parent.summary,
    }));
    setShowParentSearch(false);
    setParentSearchResults([]);
    setParentSearchQuery("");
  };

  const handleRemoveParent = () => {
    setItem((prev) => ({
      ...prev,
      parentKey: undefined,
      parentSummary: undefined,
    }));
    setEditState((prev) => ({
      ...prev,
      parentKey: undefined,
      parentSummary: undefined,
    }));
  };

  const handleSaveEdit = () => {
    setItem({ ...editState });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditState({ ...item });
    setIsEditing(false);
  };

  return (
    <div
      className={`my-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-5 py-4 cursor-pointer select-none border-b ${isExpanded ? 'border-[var(--color-border-light)]' : 'border-transparent'} ${typeConfig.bg} transition-colors`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
          <span className="text-xl flex-shrink-0">{typeConfig.icon}</span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex-shrink-0 ${typeConfig.color} bg-[var(--color-surface)] shadow-sm`}
          >
            {item.type}
          </span>
          <span className="font-semibold text-[var(--color-text-primary)] text-base truncate">
            {item.summary}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {item.storyPoints && (
            <span className="text-xs bg-[var(--color-surface)] text-[var(--color-text-secondary)] px-2.5 py-1 rounded-md font-medium shadow-sm border border-[var(--color-border-light)]">
              {item.storyPoints} SP
            </span>
          )}
          {item.priority && PRIORITY_CONFIG[item.priority] && (
            <span className="text-base" title={item.priority}>
              {PRIORITY_CONFIG[item.priority].icon}
            </span>
          )}
          {pushed && (
            <span className="text-xs bg-[var(--color-success-subtle)] text-[var(--color-success)] px-2.5 py-1 rounded-md font-bold flex items-center gap-1 shadow-sm border border-[var(--color-success-light)]">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              {pushResult?.jiraKey}
            </span>
          )}
          <svg
            className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
              }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Body (collapsible) */}
      {isExpanded && (
        <div className="p-5 space-y-4 animate-fade-in">
          {/* Parent Link */}
          {item.parentKey && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] rounded-lg px-4 py-2 border border-[var(--color-border-light)]">
              <svg
                className="w-4 h-4 text-[var(--color-accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 11l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
              <span>
                Linked under{" "}
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {item.parentKey}
                </span>
                {item.parentSummary && (
                  <span className="text-[var(--color-text-tertiary)]">
                    {" "}
                    — {item.parentSummary}
                  </span>
                )}
              </span>
              {!pushed && (
                <button
                  onClick={handleRemoveParent}
                  className="ml-auto text-[var(--color-error)] hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)] p-1 rounded transition-colors"
                  title="Remove parent link"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          )}

          {/* Description */}
          {isEditing ? (
            <div className="space-y-4 bg-[var(--color-bg-secondary)] p-4 rounded-xl border border-[var(--color-border-light)]">
              <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                    Summary
                  </label>
                  <input
                    type="text"
                    value={editState.summary}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, summary: e.target.value }))
                    }
                    className="input bg-[var(--color-surface)] w-full"
                  />
              </div>
              <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editState.description}
                    onChange={(e) =>
                      setEditState((s) => ({ ...s, description: e.target.value }))
                    }
                    className="input bg-[var(--color-surface)] w-full min-h-[100px] resize-y py-2"
                  />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                    Story Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={13}
                    value={editState.storyPoints || ""}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        storyPoints: Number(e.target.value) || undefined,
                      }))
                    }
                    className="input bg-[var(--color-surface)] w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={editState.priority || "Medium"}
                    onChange={(e) =>
                      setEditState((s) => ({
                        ...s,
                        priority: e.target.value as BacklogItem["priority"],
                      }))
                    }
                    className="input bg-[var(--color-surface)] w-full"
                  >
                    {["Highest", "High", "Medium", "Low", "Lowest"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Acceptance Criteria Editor */}
              {editState.acceptanceCriteria &&
                editState.acceptanceCriteria.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                      Acceptance Criteria
                    </label>
                    <div className="space-y-2">
                        {editState.acceptanceCriteria.map((ac, i) => (
                        <div key={i} className="flex gap-2">
                            <input
                            type="text"
                            value={ac}
                            onChange={(e) => {
                                const updated = [
                                ...(editState.acceptanceCriteria || []),
                                ];
                                updated[i] = e.target.value;
                                setEditState((s) => ({
                                ...s,
                                acceptanceCriteria: updated,
                                }));
                            }}
                            className="input flex-1 bg-[var(--color-surface)] py-1.5"
                            />
                            <button
                            onClick={() => {
                                const updated = (
                                editState.acceptanceCriteria || []
                                ).filter((_, idx) => idx !== i);
                                setEditState((s) => ({
                                ...s,
                                acceptanceCriteria: updated,
                                }));
                            }}
                            className="btn-icon-sm text-[var(--color-error)] hover:bg-[var(--color-error-light)]"
                            >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        ))}
                    </div>
                    <button
                      onClick={() =>
                        setEditState((s) => ({
                          ...s,
                          acceptanceCriteria: [
                            ...(s.acceptanceCriteria || []),
                            "",
                          ],
                        }))
                      }
                      className="text-sm text-[var(--color-accent)] font-medium hover:text-[var(--color-accent-active)] mt-3 flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add criteria
                    </button>
                  </div>
                )}

              <div className="flex gap-3 pt-4 border-t border-[var(--color-border-light)] mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="btn btn-primary text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="btn btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[var(--color-text-secondary)] leading-relaxed text-base whitespace-pre-wrap">
                {item.description}
              </p>

              {/* Acceptance Criteria */}
              {item.acceptanceCriteria &&
                item.acceptanceCriteria.length > 0 && (
                  <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 border border-[var(--color-border-light)] mt-4">
                    <h4 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                      Acceptance Criteria
                    </h4>
                    <ul className="space-y-2">
                      {item.acceptanceCriteria.map((ac, i) => (
                        <li
                          key={i}
                          className="text-sm text-[var(--color-text-primary)] flex items-start gap-2 bg-[var(--color-surface)] p-2.5 rounded-lg border border-[var(--color-border-light)] shadow-sm"
                        >
                          <div className="w-5 h-5 rounded-full bg-[var(--color-success-subtle)] text-[var(--color-success)] flex items-center justify-center shrink-0 mt-0.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <span className="leading-relaxed">{ac}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </>
          )}

          {/* Parent Search */}
          {!pushed && showParentSearch && (
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 space-y-3 shadow-lg animate-fade-in">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={parentSearchQuery}
                  onChange={(e) => setParentSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchParents()}
                  placeholder="Search existing epics/stories..."
                  className="input flex-1"
                />
                <button
                  onClick={handleSearchParents}
                  disabled={searchingParents}
                  className="btn btn-primary"
                >
                  {searchingParents ? "..." : "Search"}
                </button>
              </div>
              {parentSearchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar border border-[var(--color-border-light)] rounded-lg p-1 bg-[var(--color-bg-secondary)]">
                  {parentSearchResults.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handleSelectParent(p)}
                      className="w-full text-left p-3 rounded-md hover:bg-[var(--color-surface)] transition-all flex items-center gap-3 hover:shadow-sm"
                    >
                      <span className="text-sm font-mono font-semibold text-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-2 py-0.5 rounded">
                        {p.key}
                      </span>
                      <span className="text-[var(--color-text-primary)] font-medium truncate flex-1">
                        {p.summary}
                      </span>
                      <span className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">{p.type}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setShowParentSearch(false);
                      setParentSearchResults([]);
                    }}
                    className="text-sm font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    Close
                  </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!pushed && (
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--color-border-light)] mt-4">
              <button
                onClick={handlePush}
                disabled={pushing}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                  pushing
                    ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] cursor-wait"
                    : "bg-gradient-to-r from-[var(--color-accent)] to-teal-600 text-white hover:to-teal-500 hover-lift hover-glow"
                }`}
              >
                {pushing ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Pushing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Push to Jira
                  </>
                )}
              </button>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary text-sm px-4 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
              )}

              {!item.parentKey && item.type !== "Epic" && (
                <button
                  onClick={() => setShowParentSearch(!showParentSearch)}
                  className="btn btn-secondary text-sm px-4 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Link Parent
                </button>
              )}
            </div>
          )}

          {/* Push Success */}
          {pushed && pushResult && (
            <div className="flex items-center gap-3 bg-[var(--color-success-subtle)] border border-[var(--color-success-light)] rounded-xl px-4 py-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-[var(--color-success)] text-sm font-semibold">
                Successfully pushed to Jira as
              </span>
              {pushResult.jiraUrl ? (
                <a
                  href={pushResult.jiraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-bold text-[var(--color-accent)] hover:text-[var(--color-accent-active)] hover:underline ml-auto"
                >
                  {pushResult.jiraKey}
                </a>
              ) : (
                <span className="text-base font-bold text-[var(--color-accent)] ml-auto">
                  {pushResult.jiraKey}
                </span>
              )}
            </div>
          )}

          {/* Push Error */}
          {pushError && (
            <div className="flex items-center gap-3 bg-[var(--color-error-light)] border border-[var(--color-error)] rounded-xl px-4 py-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-[var(--color-error)] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <span className="text-[var(--color-error)] text-sm font-medium">{pushError}</span>
              <button
                onClick={() => setPushError(null)}
                className="ml-auto text-[var(--color-error)] opacity-70 hover:opacity-100 p-1 rounded transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BacklogCard;
