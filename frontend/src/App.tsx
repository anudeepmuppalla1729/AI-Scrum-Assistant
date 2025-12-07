import { BrowserRouter, Routes, Route } from "react-router-dom";
import CallbackPage from "./pages/CallbackPage.tsx";
import SuccessPage from "./pages/SuccessPage.tsx";
import LoginWithJiraButton from "./components/LoginWIthJiraButton.tsx"
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import PRDGeneratorPage from "./pages/PRDGeneratorPage";
import WorkspaceSelect from "./pages/WorkspaceSelect";
import Layout from "./components/Layout";
import RequireAuth from "./components/auth/RequireAuth";
import RequireWorkspace from "./components/auth/RequireWorkspace";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/oauth/callback" element={<CallbackPage />} />
        <Route path="/oauth/success" element={<SuccessPage />} />
        <Route path="/" element={<LoginWithJiraButton />} />

        {/* Level 1: Require Authentication (Token) */}
        <Route element={<RequireAuth />}>
          {/* Workspace Selection - Needs Auth but not Workspace */}
          <Route path="/workspace" element={<WorkspaceSelect />} />

          {/* Level 2: Require Workspace */}
          <Route element={<RequireWorkspace />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/prd" element={<PRDGeneratorPage />} />
              <Route path="/tools/standup" element={<div className="p-8">Standup Generator Coming Soon</div>} />
              <Route path="/tools/retro" element={<div className="p-8">Retrospective Generator Coming Soon</div>} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


export default App;

