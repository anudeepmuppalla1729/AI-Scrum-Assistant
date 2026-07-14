import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { getSprints, getSprintIssues } from "../api/jira";
import type { JiraSprint, JiraIssue } from "../types";
import { PageContainer } from "../components/layout/PageContainer";
import { Spinner } from "../components/ui/Spinner";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import {
  FileText,
  MessageSquare,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import "./DashboardPage.css";

export function DashboardPage() {
  const navigate = useNavigate();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [activeSprint, setActiveSprint] = useState<JiraSprint | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspace) return;

    getSprints(workspace.boardId)
      .then((allSprints) => {
        const active = allSprints.find((s) => s.state === "active") ?? null;
        setActiveSprint(active);
        if (active) {
          return getSprintIssues(active.id);
        }
        return [];
      })
      .then(setIssues)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspace]);

  const stats = {
    total: issues.length,
    done: issues.filter((i) => i.fields.status.name.toLowerCase() === "done").length,
    inProgress: issues.filter((i) => i.fields.status.name.toLowerCase() === "in progress").length,
    blocked: issues.filter((i) => i.fields.status.name.toLowerCase() === "blocked").length,
  };

  const completionPct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  if (loading) {
    return (
      <PageContainer>
        <div className="dashboard-loading">
          <Spinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="dashboard-subtitle">{workspace?.boardName}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">
              <BarChart3 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Issues</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">
              <CheckCircle2 size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.done}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.inProgress}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-red">
              <AlertCircle size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.blocked}</span>
              <span className="stat-label">Blocked</span>
            </div>
          </div>
        </div>

        {/* Sprint Progress */}
        {activeSprint && (
          <div className="sprint-progress card">
            <div className="sprint-progress-header">
              <div>
                <h3>{activeSprint.name}</h3>
                <span className="sprint-progress-subtitle">
                  {completionPct}% complete &middot; {stats.done}/{stats.total} issues
                </span>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <h3 className="section-title">Quick Actions</h3>
        <div className="quick-actions">
          <button className="quick-action-card" onClick={() => navigate("/prd")}>
            <div className="quick-action-icon">
              <FileText size={24} />
            </div>
            <h4>Backlog Generator</h4>
            <p>Upload a PRD and generate Jira tickets with AI</p>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/chat")}>
            <div className="quick-action-icon">
              <MessageSquare size={24} />
            </div>
            <h4>AI Copilot</h4>
            <p>Chat with your Scrum assistant about sprints and backlogs</p>
          </button>
          <button className="quick-action-card" onClick={() => navigate("/sprints")}>
            <div className="quick-action-icon">
              <ClipboardList size={24} />
            </div>
            <h4>View Sprints</h4>
            <p>Browse sprints and review issue details</p>
          </button>
        </div>

        {/* Active Sprint Issues */}
        {issues.length > 0 && (
          <>
            <h3 className="section-title">Active Sprint Issues</h3>
            <div className="issues-table-wrapper card">
              <table className="issues-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Summary</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Assignee</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {issues.length === 0 && !loading && (
          <EmptyState
            icon={<ClipboardList size={48} />}
            title="No issues in active sprint"
            description="Start by generating a backlog from a PRD."
            action={
              <Button onClick={() => navigate("/prd")}>Go to Backlog Generator</Button>
            }
          />
        )}
      </div>
    </PageContainer>
  );
}

function getStatusVariant(status: string): "success" | "primary" | "warning" | "error" | "default" {
  const s = status.toLowerCase();
  if (s === "done") return "success";
  if (s === "in progress") return "primary";
  if (s === "blocked") return "error";
  if (s === "to do") return "default";
  return "default";
}
