import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { getBoards } from "../api/jira";
import type { JiraBoard } from "../types";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { LayoutGrid } from "lucide-react";
import "./WorkspacePage.css";

export function WorkspacePage() {
  const navigate = useNavigate();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBoards()
      .then(setBoards)
      .catch(() => setError("Failed to load boards"))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (board: JiraBoard) => {
    setWorkspace({
      boardId: board.id,
      boardName: board.name,
      projectKey: board.location?.projectKey ?? undefined,
    });
    navigate("/dashboard");
  };

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <h1>Select a Board</h1>
        <p className="workspace-subtitle">Choose a Jira board to get started</p>
      </div>

      {loading && (
        <div className="workspace-loading">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <EmptyState
          title="Couldn't load boards"
          description={error}
        />
      )}

      {!loading && !error && boards.length === 0 && (
        <EmptyState
          icon={<LayoutGrid size={48} />}
          title="No boards found"
          description="Make sure you have access to at least one Jira board."
        />
      )}

      {!loading && !error && (
        <div className="workspace-grid">
          {boards.map((board) => (
            <button
              key={board.id}
              className="workspace-card"
              onClick={() => handleSelect(board)}
            >
              <div className="workspace-card-icon">
                <LayoutGrid size={24} />
              </div>
              <div className="workspace-card-info">
                <h3>{board.name}</h3>
                <span className="workspace-card-type">{board.type}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
