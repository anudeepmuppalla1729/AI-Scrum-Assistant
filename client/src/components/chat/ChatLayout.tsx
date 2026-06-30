import React from "react";

interface ChatLayoutProps {
  sidebar: React.ReactNode;
  chatArea: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ sidebar, chatArea }) => {
  return (
    <div className="chat-layout">
      {/* Sidebar - Fixed width on desktop, hidden on mobile */}
      <aside className="sidebar hide-mobile border-r border-[var(--color-border)] shadow-sm z-[var(--z-base)]">
        {sidebar}
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        {chatArea}
      </main>
    </div>
  );
};

export default ChatLayout;
