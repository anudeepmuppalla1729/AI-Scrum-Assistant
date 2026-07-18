import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "../components/ui/Spinner";

const API_BASE = import.meta.env.VITE_API_URL || "";

export function OAuthCallbackPage() {
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    if (code) {
      // Redirect to backend for token exchange
      window.location.href = `${API_BASE}/auth/jira/callback?code=${code}`;
    }
  }, [params]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <Spinner size="lg" />
    </div>
  );
}
