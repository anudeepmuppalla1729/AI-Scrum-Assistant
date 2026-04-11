import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const CallbackPage = () => {
  const [params] = useSearchParams();
  const code = params.get("code");

  useEffect(() => {
    if (!code) return;

    // Forward to backend callback route
    window.location.href = `http://localhost:2000/auth/jira/callback?code=${code}`;
  }, [code]);

  return <div>Connecting to Jira…</div>;
};

export default CallbackPage;
