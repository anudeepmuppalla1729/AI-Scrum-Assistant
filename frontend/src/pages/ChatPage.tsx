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

const ChatPage: React.FC = () => {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const {
    sessions,
    activeSessionId,
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
    sendMessage,
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
      loadSessions(token);
    }
  }, [token, loadSessions]);

  useEffect(() => {
    loadSessionHistory();
  }, [loadSessionHistory]);

  // 2. Sync URL -> Store & Auto-open
  useEffect(() => {
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
  }, [urlSessionId, setActiveSession, activeSessionId, sessions, navigate]);

  // 3. Handlers
  const handleSelectSession = (id: string) => {
    setActiveSession(id);
    navigate(`/chat/${id}`);
  };

  const handleCreateSession = async () => {
    if (token) {
      const newId = await createSession(token);
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
    await sendMessage(text);
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
          <div className="flex flex-col h-full w-full">
            <ChatHeader loading={isChatLoading} />
            <ChatMessages
              messages={messages}
              loading={isChatLoading}
              sessionId={activeSessionId}
              pushedSessionItems={pushedSessionItems}
              onBacklogPushed={handleBacklogPushed}
            />
            <ChatInputBar onSend={handleSendMessage} disabled={isChatLoading} />
          </div>
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
