import React from "react";

interface PRDLayoutProps {
  sidebar: React.ReactNode;
  mainArea: React.ReactNode;
}

const PRDLayout: React.FC<PRDLayoutProps> = ({ sidebar, mainArea }) => {
  return (
    <div className="flex h-full overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Sidebar - Fixed width on desktop */}
      <aside className="sidebar hide-mobile border-r border-[var(--color-border)] shadow-sm z-[var(--z-base)] shrink-0 hidden md:flex flex-col">
        {sidebar}
      </aside>

      {/* Main Area */}
      <main className="flex-1 min-w-0 flex flex-col relative w-full h-full overflow-hidden bg-[var(--color-surface)]">
        {mainArea}
      </main>
    </div>
  );
};

export default PRDLayout;
