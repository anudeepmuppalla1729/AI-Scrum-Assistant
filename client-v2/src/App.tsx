import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TopBar } from "./components/layout/TopBar";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireWorkspace } from "./components/auth/RequireWorkspace";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { OAuthSuccessPage } from "./pages/OAuthSuccessPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { DashboardPage } from "./pages/DashboardPage";
import { SprintsPage } from "./pages/SprintsPage";
import { ChatPage } from "./pages/ChatPage";
import { PRDPage } from "./pages/PRDPage";
import { BacklogReviewPage } from "./pages/BacklogReviewPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { DocsPage } from "./pages/DocsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/oauth/success" element={<OAuthSuccessPage />} />

        {/* Public with TopBar */}
        <Route element={<TopBarLayout />}>
          <Route path="/docs" element={<DocsPage />} />
        </Route>

        {/* Free — no login required (backlog generation) */}
        <Route element={<TopBarLayout />}>
          <Route path="/prd" element={<PRDPage />} />
          <Route path="/prd/:sessionId" element={<PRDPage />} />
        </Route>

        {/* Auth required */}
        <Route element={<RequireAuth />}>
          <Route path="/workspace" element={<WorkspacePage />} />

          {/* Workspace required — with TopBar */}
          <Route element={<RequireWorkspace />}>
            <Route element={<TopBarLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sprints" element={<SprintsPage />} />
              <Route path="/backlog/review/:id" element={<BacklogReviewPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:sessionId" element={<ChatPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

import { Outlet } from "react-router-dom";

function TopBarLayout() {
  return (
    <>
      <TopBar />
      <Outlet />
    </>
  );
}
