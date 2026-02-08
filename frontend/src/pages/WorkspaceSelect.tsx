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
    });
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        <WorkspaceHeader step={1} boardName={undefined} />

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                {error.includes("backend") && (
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm text-red-600 font-medium hover:text-red-500 underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <BoardSelector
              boards={boards}
              selectedBoardId={null}
              onSelect={handleBoardSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceSelect;
