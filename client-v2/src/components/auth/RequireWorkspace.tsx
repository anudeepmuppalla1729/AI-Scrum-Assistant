import { Navigate, Outlet } from "react-router-dom";
import { useWorkspaceStore } from "../../store/useWorkspaceStore";

export function RequireWorkspace() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  if (!workspace) return <Navigate to="/workspace" replace />;
  return <Outlet />;
}
