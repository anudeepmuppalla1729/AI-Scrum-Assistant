import React from "react";
import { useLocation } from "react-router-dom";
import ModeNavItem from "./ModeNavItem";
import ToolsDropdown from "./ToolsDropdown";

const ModeBar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="modebar">
      <ModeNavItem
        label="Chat"
        path="/chat"
        isActive={location.pathname === "/chat"}
      />
      <ModeNavItem
        label="Sprints"
        path="/sprints"
        isActive={location.pathname === "/sprints"}
      />
      <ModeNavItem
        label="Backlog Generator"
        path="/prd"
        isActive={location.pathname === "/prd"}
      />
      <ModeNavItem
        label="Documents"
        path="/documents"
        isActive={location.pathname === "/documents"}
      />
      
      <div className="flex-1"></div>
      <ToolsDropdown />
    </div>
  );
};

export default ModeBar;
