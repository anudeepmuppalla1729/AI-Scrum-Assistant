import React from "react";
import ChatSidebarItem from "./ChatSidebarItem";
import type { ChatSession } from "../../types/chat.types";

interface ChatSidebarProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onCreateSession: () => void;
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, newTitle: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    sessions,
    activeSessionId,
    onSelectSession,
    onCreateSession,
    onDeleteSession,
    onRenameSession,
}) => {
    return (
        <div className="chat-sidebar-inner">
            {/* New Chat Button */}
            <div className="sidebar-header">
                <button
                    onClick={onCreateSession}
                    className="btn btn-primary btn-full shadow-sm"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New Chat
                </button>
            </div>

            {/* Session List */}
            <div className="sidebar-body stagger-children">
                <h3 className="sidebar-title">
                    Recent
                </h3>
                {sessions.length === 0 ? (
                    <div className="empty-state p-4">
                        <div className="empty-state-icon w-10 h-10 mb-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="empty-state-desc">No chats yet.</p>
                    </div>
                ) : (
                    sessions.map((session, index) => (
                        <div key={session._id} style={{ '--index': index } as React.CSSProperties}>
                            <ChatSidebarItem
                                session={session}
                                isActive={session._id === activeSessionId}
                                onClick={() => onSelectSession(session._id)}
                                onDelete={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session._id);
                                }}
                                onRename={(newTitle) => onRenameSession(session._id, newTitle)}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
