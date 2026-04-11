import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const SuccessPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token");

  useEffect(() => {
    const run = async () => {
      if (!token) return;

      localStorage.setItem("token", token);

      const res = await fetch("http://localhost:2000/auth/jira/cloud-id", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        console.error("Failed to fetch cloudId");
        return;
      }

      const data = await res.json();
      console.log("Cloud ID:", data.cloudId);

      localStorage.setItem("cloudId", data.cloudId);

      navigate("/workspace");
    };

    run();
  }, [token, navigate]);

  return <div>Finalizing authentication…</div>;
};

export default SuccessPage;
