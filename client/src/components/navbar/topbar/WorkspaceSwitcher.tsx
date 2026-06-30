import React, { useState } from "react";
import { useWorkspaceStore } from "../../../store/useWorkspaceStore";
import WorkspaceDropdown from "./WorkspaceDropdown";
import { useNavigate } from "react-router-dom";

const WorkspaceSwitcher: React.FC = () => {
  const { workspace } = useWorkspaceStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSwitcherClick = () => {
    if (!workspace) {
      navigate("/workspace");
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSwitcherClick}
        className="workspace-switcher"
      >
        <div className="workspace-switcher-content">
          {workspace ? (
            <>
              <div className="workspace-icon-box">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
              </div>
              <span>{workspace.boardName}</span>
              <svg
                className={`ml-1 h-4 w-4 text-[var(--color-text-tertiary)] transition-transform ${isDropdownOpen ? "transform rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </>
          ) : (
            <span className="text-[var(--color-text-tertiary)]">
              No workspace selected
            </span>
          )}
        </div>
      </button>
      <WorkspaceDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
      />
    </div>
  );
};

export default WorkspaceSwitcher;
