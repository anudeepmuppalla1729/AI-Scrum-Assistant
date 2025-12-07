import React from "react";

interface ChatLayoutProps {
    sidebar: React.ReactNode;
    chatArea: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ sidebar, chatArea }) => {
    return (
        <div className="flex h-full overflow-hidden bg-white">
            {/* Sidebar - Fixed width on desktop, hidden on mobile logic handled by parent or CSS */}
            <aside className="w-64 border-r border-gray-200 bg-gray-50 flex-shrink-0 hidden md:flex flex-col">
                {sidebar}
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col relative w-full">
                {chatArea}
            </main>
        </div>
    );
};

export default ChatLayout;
