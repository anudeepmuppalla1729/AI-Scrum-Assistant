import { useNavigate, useLocation } from "react-router-dom";
import { useWorkspaceStore } from "../../store/useWorkspaceStore";
import { useAuthStore } from "../../store/useAuthStore";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  FolderKanban,
  ClipboardList,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import "./TopBar.css";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/sprints", label: "Sprints", icon: ClipboardList },
  { path: "/prd", label: "Backlog Generator", icon: FileText },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/documents", label: "Documents", icon: FolderKanban },
];

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const logout = useAuthStore((s) => s.logout);
  const clearWorkspace = useWorkspaceStore((s) => s.clearWorkspace);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    clearWorkspace();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/chat") return location.pathname.startsWith("/chat");
    if (path === "/prd") return location.pathname.startsWith("/prd") || location.pathname.startsWith("/backlog");
    return location.pathname === path;
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="topbar-brand" onClick={() => navigate("/workspace")}>
          <div className="topbar-logo">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
              <path d="M8 10h16M8 16h12M8 22h8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="topbar-brand-text">AI Scrum Assistant</span>
        </button>

        <nav className="topbar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`topbar-nav-item ${isActive(item.path) ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          {workspace && (
            <div className="topbar-workspace">
              <span className="topbar-workspace-name">{workspace.boardName}</span>
            </div>
          )}
          <div className="topbar-user-menu" ref={menuRef}>
            <button className="topbar-user-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <div className="topbar-avatar">
                <span>{workspace?.boardName?.charAt(0) ?? "U"}</span>
              </div>
              <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <div className="topbar-dropdown">
                <button
                  className="topbar-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/workspace");
                  }}
                >
                  Switch Workspace
                </button>
                <button className="topbar-dropdown-item danger" onClick={handleLogout}>
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
