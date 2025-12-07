import React from "react";

interface PRDLayoutProps {
    sidebar: React.ReactNode;
    mainArea: React.ReactNode;
}

const PRDLayout: React.FC<PRDLayoutProps> = ({ sidebar, mainArea }) => {
    return (
        <div className="flex h-full overflow-hidden bg-white">
            {/* Sidebar - Fixed width on desktop */}
            <aside className="w-64 border-r border-gray-200 bg-gray-50 flex-shrink-0 hidden md:flex flex-col">
                {sidebar}
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col relative w-full overflow-hidden">
                {mainArea}
            </main>
        </div>
    );
};

export default PRDLayout;
