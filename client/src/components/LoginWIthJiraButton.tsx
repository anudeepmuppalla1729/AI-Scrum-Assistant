import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

const LoginWithJiraButton = () => {
  const navigate = useNavigate();
  const workspace = useWorkspaceStore((state) => state.workspace);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // If we have a workspace in the store (or persisted), go to chat
      // Otherwise go to workspace selection
      // Note: The store persistence hydrates automatically, but might be async slightly.
      // Checking localStorage directly for workspace is a safer bet for immediate redirect logic
      // if store isn't ready.
      const storedWorkspace = localStorage.getItem("workspace");

      if (workspace || (storedWorkspace && storedWorkspace !== "null")) {
        navigate("/chat");
      } else {
        navigate("/workspace");
      }
    }
  }, [navigate, workspace]);

  const handleLogin = () => {
    // Redirect to backend which triggers OAuth
    window.location.href = "http://localhost:2000/auth/jira/login";
  };

  return (
    <div className="login-layout">
      <h1 className="login-title">AI Scrum Assistant</h1>
      <button
        onClick={handleLogin}
        className="btn btn-primary btn-lg shadow-[var(--shadow-elevation-lg)] hover-lift"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 mr-2"
        >
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14.5c-2.485 0-4.5-2.015-4.5-4.5S10.515 7.5 13 7.5c1.47 0 2.766.712 3.568 1.808l-1.397 1.056C14.717 9.691 13.921 9.25 13 9.25c-1.517 0-2.75 1.233-2.75 2.75S11.483 14.75 13 14.75c.92 0 1.716-.441 2.17-1.114l1.398 1.056C15.767 15.788 14.47 16.5 13 16.5z" />
        </svg>
        Login with Jira
      </button>
      <p className="login-subtitle">Connect your Atlassian account to get started</p>
    </div>
  );
};

export default LoginWithJiraButton;
