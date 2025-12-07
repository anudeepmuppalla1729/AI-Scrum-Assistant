import React from "react";
import { useWorkspaceStore } from "../../store/useWorkspaceStore";

interface ChatHeaderProps {
    loading?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ loading }) => {
    const { workspace } = useWorkspaceStore();
    const { boardName, sprintName } = workspace || {};

    return (
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
            <div>
                <h1 className="text-lg font-semibold text-gray-900">AI Scrum Assistant</h1>
                <p className="text-sm text-gray-500">
                    Chat with your sprint-aware assistant
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Workspace</p>
                    <p className="text-sm text-gray-700">
                        {boardName ? `${boardName}` : "No Board"} · {sprintName ? `${sprintName}` : "No Sprint"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`h-2.5 w-2.5 rounded-full ${loading ? "bg-amber-400 animate-pulse" : "bg-green-500"}`}
                    />
                    <span className="text-sm text-gray-600 font-medium">
                        {loading ? "Thinking..." : "Ready"}
                    </span>
                </div>
            </div>
        </header>
    );
};
