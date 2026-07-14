import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { getCloudId } from "../api/auth";
import { Spinner } from "../components/ui/Spinner";

export function OAuthSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    setToken(token);

    getCloudId()
      .then(({ cloudId }) => {
        localStorage.setItem("cloudId", cloudId);
        navigate("/workspace", { replace: true });
      })
      .catch(() => {
        navigate("/workspace", { replace: true });
      });
  }, [params, setToken, navigate]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <Spinner size="lg" />
    </div>
  );
}
