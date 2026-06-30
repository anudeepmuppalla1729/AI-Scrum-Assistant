import React, { useEffect, useState } from "react";
import type { PushedBacklogRecord } from "../../types/chat.types";
import { getPushHistory } from "../../api/backlogApi";

interface PushHistoryPanelProps {
  sessionId?: string | null;
  refreshTrigger?: number; // increment to trigger refresh
}

const TYPE_COLORS: Record<string, string> = {
  Epic: "bg-[var(--color-purple-subtle)] text-[var(--color-purple)]",
  Story: "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
  Task: "bg-[var(--color-info-subtle)] text-[var(--color-info)]",
  Subtask: "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]",
  Bug: "bg-[var(--color-error-light)] text-[var(--color-error)]",
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
        className={`push-history-toggle hover-lift hover-glow shadow-[var(--shadow-elevation-md)] ${isOpen ? "open" : ""}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="push-history-toggle-text">
          Push History
          {history.length > 0 && !isOpen && (
            <span className="push-history-badge shadow-sm">
              {history.length}
            </span>
          )}
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Panel */}
      <div className={`slide-over-panel ${isOpen ? "open" : ""}`}>
        {/* Panel Header */}
        <div className="slide-over-header">
          <div>
            <h2 className="heading-md m-0">Push History</h2>
            <p className="text-xs text-[var(--color-text-tertiary)] font-medium mt-1 uppercase tracking-wider">
              Items pushed to Jira
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="btn-icon text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        {sessionId && (
          <div className="flex px-6 pt-4 gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 text-xs rounded-full transition-all font-semibold ${
                filter === "all"
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setFilter("session")}
              className={`px-4 py-1.5 text-xs rounded-full transition-all font-semibold ${
                filter === "session"
                  ? "bg-[var(--color-accent)] text-white shadow-sm"
                  : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
              }`}
            >
              This Session
            </button>
          </div>
        )}

        {/* History List */}
        <div className="slide-over-body custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 bg-[var(--color-accent)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2.5 h-2.5 bg-[var(--color-accent)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2.5 h-2.5 bg-[var(--color-accent)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon border border-[var(--color-border-light)]">
                  <svg
                    className="w-8 h-8 text-[var(--color-text-tertiary)]"
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
              </div>
              <p className="empty-state-title">No items pushed yet</p>
              <p className="empty-state-desc">
                Craft backlog items in the chat and push them to Jira
              </p>
            </div>
          ) : (
            history.map((item, index) => (
              <div
                key={item._id}
                className="history-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="history-card-header">
                  <div className="history-card-content">
                    <div className="history-card-tags">
                      <span
                        className={`history-card-type ${
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
                          className="history-card-key"
                        >
                          {item.jiraKey}
                        </a>
                      ) : (
                        <span className="history-card-key">
                          {item.jiraKey}
                        </span>
                      )}
                    </div>
                    <p className="history-card-summary">
                      {item.summary}
                    </p>
                    {item.parentKey && (
                      <div className="history-card-parent">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
                        <span className="history-card-parent-text">Under {item.parentKey}</span>
                        {item.parentSummary && (
                          <span className="history-card-parent-summary">— {item.parentSummary}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="history-card-meta">
                    <p className="history-card-date">
                      {formatDate(item.createdAt)}
                    </p>
                    {item.storyPoints && (
                      <p className="history-card-points">
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
    </>
  );
};

export default PushHistoryPanel;
