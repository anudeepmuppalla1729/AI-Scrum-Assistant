import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { getSprints, getSprintIssues } from "../api/jiraApi";
import type { JiraSprint, JiraIssue } from "../types/jira";
import PRDLayout from "../components/prd/PRDLayout";

const SprintPage: React.FC = () => {
  const workspace = useWorkspaceStore((state) => state.workspace);
  const [sprints, setSprints] = useState<JiraSprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);

  // Loading States
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Sprints on mount
  useEffect(() => {
    if (!workspace?.boardId) return;

    const fetchSprints = async () => {
      setLoadingSprints(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const data = await getSprints(workspace.boardId, token);
        setSprints(data || []);
      } catch (err: any) {
        console.error("Failed to fetch sprints:", err);
        setError("Failed to load sprints.");
      } finally {
        setLoadingSprints(false);
      }
    };

    fetchSprints();
  }, [workspace?.boardId]);

  // Fetch Issues when a sprint is selected
  useEffect(() => {
    if (!selectedSprintId) {
      setIssues([]);
      return;
    }

    const fetchIssues = async () => {
      setLoadingIssues(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const data = await getSprintIssues(selectedSprintId, token);
        setIssues(data || []);
      } catch (err: any) {
        console.error("Failed to fetch issues:", err);
        setError("Failed to load issues.");
      } finally {
        setLoadingIssues(false);
      }
    };

    fetchIssues();
  }, [selectedSprintId]);

  if (!workspace) return <div style={{ padding: 'var(--space-6)' }}>No workspace selected.</div>;

  return (
    <PRDLayout
      sidebar={
        <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-primary)', borderRight: '1px solid var(--color-border)' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-light)' }}>
            <h2 className="heading-md m-0">Sprints</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0 0 0' }}>Board: {workspace.boardName}</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingSprints ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                Loading sprints...
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {sprints.map((sprint) => (
                  <li
                    key={sprint.id}
                    onClick={() => setSelectedSprintId(sprint.id)}
                    style={{ 
                      padding: 'var(--space-4)', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid var(--color-border-light)',
                      background: selectedSprintId === sprint.id ? 'var(--color-accent-lighter)' : 'transparent',
                      borderLeft: selectedSprintId === sprint.id ? '4px solid var(--color-accent)' : '4px solid transparent',
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--color-text-primary)' }}>
                        {sprint.name}
                      </span>
                      <span className={`badge ${sprint.state === 'active' ? 'badge-epic' : 'badge-neutral'}`}>
                        {sprint.state}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                      ID: {sprint.id}
                    </div>
                  </li>
                ))}
                {sprints.length === 0 && !loadingSprints && (
                  <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                    No sprints found.
                  </div>
                )}
              </ul>
            )}
          </div>
        </div>
      }
      mainArea={
        <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-bg-secondary)' }}>
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-light)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 className="heading-md m-0">
              {selectedSprintId
                ? `Issues in ${sprints.find((s) => s.id === selectedSprintId)?.name}`
                : "Select a sprint to view issues"}
            </h2>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)' }}>
            {error && (
              <div className="alert-error">
                <p>{error}</p>
              </div>
            )}

            {loadingIssues ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-tertiary)' }}>
                Loading issues...
              </div>
            ) : !selectedSprintId ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-tertiary)' }}>
                Please select a sprint from the left sidebar
              </div>
            ) : issues.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-tertiary)' }}>
                No issues found in this sprint.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                {issues.map((issue: any) => (
                  <div key={issue.id || issue.key} className="epic-card" style={{ padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                      <span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>
                        {issue.key}
                      </span>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {issue.fields?.priority?.name && (
                          <span className={`badge ${issue.fields.priority.name === "High" || issue.fields.priority.name === "Highest" ? "badge-bug" : "badge-neutral"}`}>
                            {issue.fields.priority.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-4)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {issue.fields?.summary || "No Summary"}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      <span className="badge badge-story">
                        {issue.fields?.status?.name || "Unknown"}
                      </span>
                      {issue.fields?.issuetype?.name && (
                        <span className="badge badge-neutral">
                          {issue.fields.issuetype.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      }
    />
  );
};

export default SprintPage;
