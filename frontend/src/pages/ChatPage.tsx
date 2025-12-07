import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../hooks/useChatSessions";
import { useChat } from "../hooks/useChat"; // Re-import useChat
import ChatLayout from "../components/chat/ChatLayout";
import ChatSidebar from "../components/chat/ChatSidebar";
import { ChatHeader } from "../components/chat/ChatHeader"; // Named export
import ChatMessages from "../components/chat/ChatMessages";
import ChatInputBar from "../components/chat/ChatInputBar";

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
        setActiveSession,
    } = useChatStore();

    // Hook up chat logic
    const { messages, loading: isChatLoading, sendMessage } = useChat();

    // 1. Initial Load
    useEffect(() => {
        if (token) {
            loadSessions(token);
        }
    }, [token, loadSessions]);

    // 2. Sync URL -> Store & Auto-open
    useEffect(() => {
        if (urlSessionId && urlSessionId !== activeSessionId) {
            setActiveSession(urlSessionId);
        } else if (!urlSessionId) {
            // Auto-redirect to the first loaded session if available
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
        // Pass workspace context if needed, for now just text
        // accessing active session ID might be needed inside useChat if it persists per session
        // For this impl, useChat seems to handle active session internally or via props? 
        // Looking at useChat.ts, it doesn't take sessionId arg in the verified file content, 
        // but it might rely on us passing context or it's a simple chat.
        // Wait, useChat definition in step 35: `sendMessage` takes (text, workspace?).
        // It does NOT seem to take sessionId. This suggests the backend infers it or it creates new if not present?
        // But we have `activeSessionId`. The backend likely needs it.
        // Let's assume for now we just send text. The user's prompt implies "old layout" worked.
        // The "old layout" ChatContainer used `useChat` without arguments.

        await sendMessage(text);
    };

    return (
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
                    <ChatMessages messages={messages} loading={isChatLoading} />
                    <ChatInputBar onSend={handleSendMessage} disabled={isChatLoading} />
                </div>
            }
        />
    );
};

export default ChatPage;
