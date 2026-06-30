import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { BoardSelector } from "../components/workspace/BoardSelector";
import { WorkspaceHeader } from "../components/workspace/WorkspaceHeader";
import type { JiraBoard } from "../types/jira";
import { getBoards } from "../api/jiraApi";

export const WorkspaceSelect: React.FC = () => {
  const navigate = useNavigate();
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

  // Local state for fetch data
  const [boards, setBoards] = useState<JiraBoard[]>([]);

  // Loading/Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load of boards
  useEffect(() => {
    const fetchBoards = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const boardsData = await getBoards(token);
        // Ensure we handle the data structure correctly.
        // api/jiraApi returns data.values which is the array.
        setBoards(boardsData || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch boards:", err);
        setError(
          "Failed to load Jira boards. Please make sure the backend is running.",
        );
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  const handleBoardSelect = (board: JiraBoard) => {
    setWorkspace({
      boardId: board.id,
      boardName: board.name,
      sprintId: null,
      sprintName: null,
      projectKey: board.location?.projectKey || null,
    });
    navigate("/chat");
  };

  return (
    <div className="workspace-select-layout">
      <div className="workspace-select-container">
        <WorkspaceHeader step={1} boardName={undefined} />

        {error && (
          <div className="alert-error">
            <div style={{ marginLeft: 'var(--space-3)' }}>
              <p>{error}</p>
              {error.includes("backend") && (
                <button onClick={() => window.location.reload()}>
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="status-indicator loading"></div>
          </div>
        ) : (
          <BoardSelector
            boards={boards}
            selectedBoardId={null}
            onSelect={handleBoardSelect}
          />
        )}
      </div>
    </div>
  );
};

export default WorkspaceSelect;
