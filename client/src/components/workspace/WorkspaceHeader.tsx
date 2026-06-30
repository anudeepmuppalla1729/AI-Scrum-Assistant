import React from "react";

interface WorkspaceHeaderProps {
  step?: number;
  boardName?: string;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = () => {
  return (
    <div className="workspace-select-header">
      <h1 className="workspace-select-title">
        Select Workspace
      </h1>
      <p className="workspace-select-subtitle">Choose a Jira board to connect with.</p>
    </div>
  );
};
