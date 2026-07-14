import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "../components/ui/Spinner";

export function OAuthCallbackPage() {
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    if (code) {
      // Redirect to backend for token exchange
      window.location.href = `/auth/jira/callback?code=${code}`;
    }
  }, [params]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <Spinner size="lg" />
    </div>
  );
}
