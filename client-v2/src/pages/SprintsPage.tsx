import { useEffect, useState } from "react";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { getSprints, getSprintIssues } from "../api/jira";
import type { JiraSprint, JiraIssue } from "../types";
import { PageContainer } from "../components/layout/PageContainer";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Calendar } from "lucide-react";
import "./SprintsPage.css";

export function SprintsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [sprints, setSprints] = useState<JiraSprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<JiraSprint | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loadingSprints, setLoadingSprints] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(false);

  useEffect(() => {
    if (!workspace) return;
    getSprints(workspace.boardId)
      .then((all) => {
        setSprints(all);
        const active = all.find((s) => s.state === "active");
        if (active) setSelectedSprint(active);
      })
      .catch(() => {})
      .finally(() => setLoadingSprints(false));
  }, [workspace]);

  useEffect(() => {
    if (!selectedSprint) {
      setIssues([]);
      return;
    }
    setLoadingIssues(true);
    getSprintIssues(selectedSprint.id)
      .then(setIssues)
      .catch(() => {})
      .finally(() => setLoadingIssues(false));
  }, [selectedSprint]);

  const getSprintBadge = (state: JiraSprint["state"]) => {
    switch (state) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "closed":
        return <Badge variant="default">Closed</Badge>;
      case "future":
        return <Badge variant="info">Future</Badge>;
    }
  };

  return (
    <PageContainer>
      <div className="sprints-page">
        <div className="sprints-header">
          <h1>Sprints</h1>
          <p className="sprints-subtitle">{workspace?.boardName}</p>
        </div>

        <div className="sprints-layout">
          {/* Sprint List */}
          <div className="sprint-list card">
            <h3 className="sprint-list-title">Sprint History</h3>
            {loadingSprints && <Spinner />}
            {!loadingSprints && sprints.length === 0 && (
              <p className="sprint-list-empty">No sprints found</p>
            )}
            {sprints.map((sprint) => (
              <button
                key={sprint.id}
                className={`sprint-list-item ${selectedSprint?.id === sprint.id ? "active" : ""}`}
                onClick={() => setSelectedSprint(sprint)}
              >
                <div className="sprint-list-item-header">
                  <span className="sprint-list-item-name">{sprint.name}</span>
                  {getSprintBadge(sprint.state)}
                </div>
                {sprint.startDate && (
                  <span className="sprint-list-item-dates">
                    {formatDate(sprint.startDate)} &mdash; {formatDate(sprint.endDate ?? "")}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Issues */}
          <div className="sprint-issues">
            {!selectedSprint && (
              <EmptyState
                icon={<Calendar size={48} />}
                title="Select a sprint"
                description="Choose a sprint from the list to view its issues."
              />
            )}

            {selectedSprint && loadingIssues && (
              <div className="sprint-issues-loading">
                <Spinner size="lg" />
              </div>
            )}

            {selectedSprint && !loadingIssues && issues.length === 0 && (
              <EmptyState
                title="No issues"
                description="This sprint has no issues."
              />
            )}

            {selectedSprint && !loadingIssues && issues.length > 0 && (
              <div className="sprint-issues-table card">
                <div className="sprint-issues-header">
                  <h3>{selectedSprint.name}</h3>
                  <span className="sprint-issues-count">{issues.length} issues</span>
                </div>
                <table className="issues-table">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Summary</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Assignee</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue) => (
                      <tr key={issue.id}>
                        <td className="issue-key">{issue.key}</td>
                        <td>{issue.fields.summary}</td>
                        <td>
                          <Badge variant="default">{issue.fields.issuetype.name}</Badge>
                        </td>
                        <td>
                          <Badge variant={getStatusVariant(issue.fields.status.name)}>
                            {issue.fields.status.name}
                          </Badge>
                        </td>
                        <td className="issue-assignee">
                          {issue.fields.assignee?.displayName ?? "Unassigned"}
                        </td>
                        <td>{issue.fields.customfield_10016 ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getStatusVariant(status: string): "success" | "primary" | "warning" | "error" | "default" {
  const s = status.toLowerCase();
  if (s === "done") return "success";
  if (s === "in progress") return "primary";
  if (s === "blocked") return "error";
  return "default";
}
