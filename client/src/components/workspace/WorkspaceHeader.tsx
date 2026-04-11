import React from "react";

interface WorkspaceHeaderProps {
  step?: number;
  boardName?: string;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = () => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Select Workspace
      </h1>
      <p className="text-gray-600">Choose a Jira board to connect with.</p>
    </div>
  );
};
