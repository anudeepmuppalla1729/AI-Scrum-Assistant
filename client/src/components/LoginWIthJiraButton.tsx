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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">AI Scrum Assistant</h1>
      <button
        onClick={handleLogin}
        style={{
          padding: "12px 24px",
          background: "#0052CC",
          color: "white",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: 600
        }}
        className="hover:bg-blue-700 transition-colors shadow-lg"
      >
        Login with Jira
      </button>
      <p className="mt-4 text-gray-500 text-sm">Connect your Atlassian account to get started</p>
    </div>
  );
};

export default LoginWithJiraButton;
