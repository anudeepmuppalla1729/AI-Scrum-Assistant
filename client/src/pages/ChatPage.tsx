import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../hooks/useChatSessions";
import { useChat } from "../hooks/useChat";
import { getPushHistory } from "../api/backlogApi";
import type { PushedBacklogRecord } from "../types/chat.types";
import ChatLayout from "../components/chat/ChatLayout";
import ChatSidebar from "../components/chat/ChatSidebar";
import { ChatHeader } from "../components/chat/ChatHeader";
import ChatMessages from "../components/chat/ChatMessages";
import ChatInputBar from "../components/chat/ChatInputBar";
import PushHistoryPanel from "../components/chat/PushHistoryPanel";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

const ChatPage: React.FC = () => {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const workspace = useWorkspaceStore((state) => state.workspace);
  const {
    sessions,
    activeSessionId,
    sessionsLoaded,
    loadSessions,
    createSession,
    deleteSession,
    renameSession,
    updateSessionTitleLocal,
    setActiveSession,
  } = useChatStore();

  // Refresh trigger for push history panel
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [pushedSessionItems, setPushedSessionItems] = useState<PushedBacklogRecord[]>([]);

  // Hook up chat logic
  const {
    messages,
    loading: isChatLoading,
    error: chatError,
    sendMessage,
    resetError,
  } = useChat(activeSessionId, (newTitle) => {
    if (activeSessionId) {
      updateSessionTitleLocal(activeSessionId, newTitle);
    }
  });

  const loadSessionHistory = useCallback(async () => {
    if (activeSessionId) {
      try {
        const history = await getPushHistory(activeSessionId);
        setPushedSessionItems(history);
      } catch (err) {
        console.error("Failed to fetch session history for chat parsing:", err);
      }
    } else {
      setPushedSessionItems([]);
    }
  }, [activeSessionId, historyRefreshTrigger]);

  // 1. Initial Load
  useEffect(() => {
    if (token) {
      loadSessions(token, workspace?.boardId);
    }
  }, [token, workspace?.boardId, loadSessions]);

  useEffect(() => {
    loadSessionHistory();
  }, [loadSessionHistory]);

  // 2. Sync URL -> Store & Auto-open
  useEffect(() => {
    if (!sessionsLoaded) return; // Wait until sessions are loaded before redirecting

    if (urlSessionId && urlSessionId !== activeSessionId) {
      setActiveSession(urlSessionId);
    } else if (!urlSessionId) {
      if (sessions.length > 0) {
        const mostRecent = sessions[0];
        navigate(`/chat/${mostRecent._id}`, { replace: true });
      } else {
        setActiveSession(null);
      }
    }
  }, [urlSessionId, setActiveSession, activeSessionId, sessions, sessionsLoaded, navigate]);

  // 3. Handlers
  const handleSelectSession = (id: string) => {
    setActiveSession(id);
    navigate(`/chat/${id}`);
  };

  const handleCreateSession = async () => {
    if (token) {
      const newId = await createSession(token, workspace?.boardId);
      if (newId) {
        navigate(`/chat/${newId}`);
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (token) await deleteSession(sessionId, token);
    if (sessionId === activeSessionId) {
      navigate("/chat");
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    if (token) await renameSession(sessionId, newTitle, token);
  };

  const handleSendMessage = async (text: string) => {
    await sendMessage(text, {
      boardId: workspace?.boardId ?? null,
      sprintId: workspace?.sprintId ?? null,
    });
  };

  const handleBacklogPushed = () => {
    // Trigger a refresh of the push history panel
    setHistoryRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <ChatLayout
        sidebar={
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
          />
        }
        chatArea={
          <>
            <ChatHeader loading={isChatLoading} />
            
            {/* Error Toast */}
            {chatError && (
              <div className="absolute top-[var(--space-4)] left-1/2 transform -translate-x-1/2 z-[var(--z-toast)]">
                <div className="toast toast-error shadow-lg flex items-center">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{chatError}</span>
                  <button onClick={resetError} className="toast-dismiss ml-2 text-current">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <ChatMessages
              messages={messages}
              loading={isChatLoading}
              sessionId={activeSessionId}
              pushedSessionItems={pushedSessionItems}
              onBacklogPushed={handleBacklogPushed}
            />
            <ChatInputBar onSend={handleSendMessage} disabled={isChatLoading} />
          </>
        }
      />
      <PushHistoryPanel
        sessionId={activeSessionId}
        refreshTrigger={historyRefreshTrigger}
      />
    </>
  );
};

export default ChatPage;
