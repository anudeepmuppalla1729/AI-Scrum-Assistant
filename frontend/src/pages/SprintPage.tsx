import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { getSprints, getSprintIssues } from "../api/jiraApi";
import type { JiraSprint, JiraIssue } from "../types/jira";

// Simple Left/Right Panel Layout
const SprintPage: React.FC = () => {
  const workspace = useWorkspaceStore((state) => state.workspace);
  const [sprints, setSprints] = useState<JiraSprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);

  // Loading States
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Sprints on mount (based on boardId)
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

  if (!workspace) return <div>No workspace selected.</div>;

  return (
    <div className="flex h-full w-full bg-white">
      {/* Left Panel: Sprints List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col min-w-[250px]">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Sprints</h2>
          <p className="text-sm text-gray-500">Board: {workspace.boardName}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingSprints ? (
            <div className="p-4 text-center text-gray-500">
              Loading sprints...
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sprints.map((sprint) => (
                <li
                  key={sprint.id}
                  onClick={() => setSelectedSprintId(sprint.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedSprintId === sprint.id
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">
                      {sprint.name}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        sprint.state === "active"
                          ? "bg-green-100 text-green-800"
                          : sprint.state === "future"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {sprint.state}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    ID: {sprint.id}
                  </div>
                </li>
              ))}
              {sprints.length === 0 && !loadingSprints && (
                <div className="p-4 text-gray-500 text-center">
                  No sprints found.
                </div>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Right Panel: Issues List */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedSprintId
              ? `Issues in ${sprints.find((s) => s.id === selectedSprintId)?.name}`
              : "Select a sprint to view issues"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4 border border-red-200">
              {error}
            </div>
          )}

          {loadingIssues ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              Loading issues...
            </div>
          ) : !selectedSprintId ? (
            <div className="flex justify-center items-center h-full text-gray-400">
              Please select a sprint from the left sidebar
            </div>
          ) : issues.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              No issues found in this sprint.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issues.map((issue: any) => (
                <div
                  key={issue.id || issue.key}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {issue.key}
                    </span>
                    <div className="flex gap-2">
                      {issue.fields?.priority?.name && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            issue.fields.priority.name === "High" ||
                            issue.fields.priority.name === "Highest"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {issue.fields.priority.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                    {issue.fields?.summary || "No Summary"}
                  </h3>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      {issue.fields?.status?.name || "Unknown"}
                    </span>
                    {issue.fields?.issuetype?.name && (
                      <span className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded">
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
    </div>
  );
};

export default SprintPage;
