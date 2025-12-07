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
        <div className="flex flex-col h-full">
            {/* New Chat Button */}
            <div className="p-4 border-b border-gray-200">
                <button
                    onClick={onCreateSession}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
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
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">
                    Recent
                </h3>
                {sessions.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 mt-8">No chats yet.</div>
                ) : (
                    sessions.map((session) => (
                        <ChatSidebarItem
                            key={session._id}
                            session={session}
                            isActive={session._id === activeSessionId}
                            onClick={() => onSelectSession(session._id)}
                            onDelete={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session._id);
                            }}
                            onRename={(newTitle) => onRenameSession(session._id, newTitle)}
                        />
                    ))
                )}
            </div>

            {/* User / Settings Footer (Optional) */}
            <div className="p-4 border-t border-gray-200">
                {/* Could put user info here */}
            </div>
        </div>
    );
};

export default ChatSidebar;
