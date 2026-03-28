import React, { useEffect, useState } from "react";
import type { PushedBacklogRecord } from "../../types/chat.types";
import { getPushHistory } from "../../api/backlogApi";

interface PushHistoryPanelProps {
  sessionId?: string | null;
  refreshTrigger?: number; // increment to trigger refresh
}

const TYPE_COLORS: Record<string, string> = {
  Epic: "bg-purple-100 text-purple-700",
  Story: "bg-green-100 text-green-700",
  Task: "bg-blue-100 text-blue-700",
  Subtask: "bg-gray-100 text-gray-600",
  Bug: "bg-red-100 text-red-600",
};

const PushHistoryPanel: React.FC<PushHistoryPanelProps> = ({
  sessionId,
  refreshTrigger,
}) => {
  const [history, setHistory] = useState<PushedBacklogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "session">("all");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getPushHistory(
        filter === "session" ? sessionId || undefined : undefined
      );
      setHistory(data);
    } catch (err) {
      console.error("Failed to load push history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, filter, refreshTrigger]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-4 bottom-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-gray-800 text-white hover:bg-gray-900"
            : "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-medium">
          Push History
          {history.length > 0 && !isOpen && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-white/20 rounded-full">
              {history.length}
            </span>
          )}
        </span>
      </button>

      {/* Slide-over Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Push History</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Items pushed to Jira
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        {sessionId && (
          <div className="flex px-5 pt-3 gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors font-medium ${
                filter === "all"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setFilter("session")}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors font-medium ${
                filter === "session"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              This Session
            </button>
          </div>
        )}

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg
                className="w-6 h-6 text-gray-300 animate-spin"
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
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p className="text-sm font-medium">No items pushed yet</p>
              <p className="text-xs mt-1">
                Craft backlog items in the chat and push them to Jira
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item._id}
                className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 hover:border-gray-200 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          TYPE_COLORS[item.type] || TYPE_COLORS.Task
                        }`}
                      >
                        {item.type}
                      </span>
                      {item.jiraUrl ? (
                        <a
                          href={item.jiraUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-blue-600 hover:underline"
                        >
                          {item.jiraKey}
                        </a>
                      ) : (
                        <span className="text-xs font-mono text-blue-600">
                          {item.jiraKey}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 font-medium line-clamp-2">
                      {item.summary}
                    </p>
                    {item.parentKey && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <span>↳</span>
                        Under {item.parentKey}
                        {item.parentSummary && (
                          <span className="truncate"> — {item.parentSummary}</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-gray-400">
                      {formatDate(item.createdAt)}
                    </p>
                    {item.storyPoints && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {item.storyPoints} SP
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default PushHistoryPanel;
