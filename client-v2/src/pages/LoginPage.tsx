import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { Button } from "../components/ui/Button";
import "./LoginPage.css";

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const workspace = useWorkspaceStore((s) => s.workspace);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(workspace ? "/dashboard" : "/workspace", { replace: true });
    }
  }, [isAuthenticated, workspace, navigate]);

  const handleLogin = () => {
    window.location.href = "/auth/jira/login";
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
            <path d="M8 10h16M8 16h12M8 22h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="login-title">Parallel Agile Assistant</h1>
        <p className="login-subtitle">
          Transform your PRDs into production-ready Jira tickets with AI-powered backlog generation.
        </p>
        <Button size="lg" onClick={handleLogin} className="login-btn">
          <div>Login with Jira</div>
        </Button>
        <button className="login-guest-btn" onClick={() => navigate("/prd")}>
          Continue without login →
        </button>
        <p className="login-footer">Secure OAuth 2.0 authentication via Atlassian</p>
      </div>
    </div>
  );
}
