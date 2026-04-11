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
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: "⚡",
  },
  Story: {
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "📖",
  },
  Task: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "✅",
  },
  Subtask: {
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-200",
    icon: "📋",
  },
};

const PRIORITY_CONFIG: Record<string, { color: string; icon: string }> = {
  Highest: { color: "text-red-600", icon: "🔴" },
  High: { color: "text-orange-500", icon: "🟠" },
  Medium: { color: "text-yellow-500", icon: "🟡" },
  Low: { color: "text-blue-400", icon: "🔵" },
  Lowest: { color: "text-gray-400", icon: "⚪" },
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
      className={`my-3 rounded-xl border-2 ${typeConfig.border} ${typeConfig.bg} shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeConfig.icon}</span>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeConfig.color} bg-white/70`}
          >
            {item.type}
          </span>
          <span className="font-semibold text-gray-800 text-sm line-clamp-1">
            {item.summary}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {item.storyPoints && (
            <span className="text-xs bg-white/80 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {item.storyPoints} SP
            </span>
          )}
          {item.priority && PRIORITY_CONFIG[item.priority] && (
            <span className="text-sm">
              {PRIORITY_CONFIG[item.priority].icon}
            </span>
          )}
          {pushed && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              ✓ {pushResult?.jiraKey}
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""
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
        <div className="px-4 pb-4 space-y-3">
          {/* Parent Link */}
          {item.parentKey && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/60 rounded-lg px-3 py-1.5">
              <svg
                className="w-3.5 h-3.5"
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
                <span className="font-semibold text-gray-700">
                  {item.parentKey}
                </span>
                {item.parentSummary && (
                  <span className="text-gray-400">
                    {" "}
                    — {item.parentSummary}
                  </span>
                )}
              </span>
              {!pushed && (
                <button
                  onClick={handleRemoveParent}
                  className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                  title="Remove parent link"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Description */}
          {isEditing ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">
                Summary
              </label>
              <input
                type="text"
                value={editState.summary}
                onChange={(e) =>
                  setEditState((s) => ({ ...s, summary: e.target.value }))
                }
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-white"
              />
              <label className="text-xs font-medium text-gray-500">
                Description
              </label>
              <textarea
                value={editState.description}
                onChange={(e) =>
                  setEditState((s) => ({ ...s, description: e.target.value }))
                }
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-white min-h-[80px] resize-y"
              />
              <div className="flex gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">
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
                    className="w-20 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
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
                    className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 bg-white"
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
                    <label className="text-xs font-medium text-gray-500">
                      Acceptance Criteria
                    </label>
                    {editState.acceptanceCriteria.map((ac, i) => (
                      <div key={i} className="flex gap-1 mt-1">
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
                          className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white"
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
                          className="text-red-400 hover:text-red-600 px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
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
                      className="text-xs text-blue-500 hover:text-blue-700 mt-1"
                    >
                      + Add criteria
                    </button>
                  </div>
                )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>

              {/* Acceptance Criteria */}
              {item.acceptanceCriteria &&
                item.acceptanceCriteria.length > 0 && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Acceptance Criteria
                    </h4>
                    <ul className="space-y-1">
                      {item.acceptanceCriteria.map((ac, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-600 flex items-start gap-1.5"
                        >
                          <span className="text-green-500 mt-0.5 text-xs">
                            ✓
                          </span>
                          {ac}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </>
          )}

          {/* Parent Search */}
          {!pushed && showParentSearch && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={parentSearchQuery}
                  onChange={(e) => setParentSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchParents()}
                  placeholder="Search existing epics/stories..."
                  className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 bg-white"
                />
                <button
                  onClick={handleSearchParents}
                  disabled={searchingParents}
                  className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {searchingParents ? "..." : "Search"}
                </button>
              </div>
              {parentSearchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {parentSearchResults.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => handleSelectParent(p)}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      <span className="text-xs font-mono text-blue-600">
                        {p.key}
                      </span>
                      <span className="text-gray-700 truncate flex-1">
                        {p.summary}
                      </span>
                      <span className="text-xs text-gray-400">{p.type}</span>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setShowParentSearch(false);
                  setParentSearchResults([]);
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {!pushed && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handlePush}
                disabled={pushing}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                  pushing
                    ? "bg-gray-300 text-gray-500 cursor-wait"
                    : "bg-linear-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-md active:scale-[0.98]"
                }`}
              >
                {pushing ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
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
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
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
                  className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-colors"
                >
                  ✏️ Edit
                </button>
              )}

              {!item.parentKey && item.type !== "Epic" && (
                <button
                  onClick={() => setShowParentSearch(!showParentSearch)}
                  className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-lg transition-colors"
                >
                  🔗 Link Parent
                </button>
              )}
            </div>
          )}

          {/* Push Success */}
          {pushed && pushResult && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <span className="text-green-600 text-sm font-medium">
                ✓ Pushed to Jira as
              </span>
              {pushResult.jiraUrl ? (
                <a
                  href={pushResult.jiraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  {pushResult.jiraKey}
                </a>
              ) : (
                <span className="text-sm font-bold text-blue-600">
                  {pushResult.jiraKey}
                </span>
              )}
            </div>
          )}

          {/* Push Error */}
          {pushError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-red-600 text-sm">{pushError}</span>
              <button
                onClick={() => setPushError(null)}
                className="ml-auto text-red-400 hover:text-red-600 text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BacklogCard;
