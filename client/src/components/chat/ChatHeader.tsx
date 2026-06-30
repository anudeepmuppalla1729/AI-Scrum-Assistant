import React from "react";
import { useWorkspaceStore } from "../../store/useWorkspaceStore";

interface ChatHeaderProps {
    loading?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ loading }) => {
    const { workspace } = useWorkspaceStore();
    const { boardName} = workspace || {};

    return (
        <header className="chat-header">
            <div>
                <h1 className="heading-md">AI Scrum Assistant</h1>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                    Chat with your sprint-aware assistant
                </p>
            </div>

            <div className="chat-header-actions">
                <div className="text-right hide-mobile">
                    <p className="text-caps mb-1">Workspace</p>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {boardName ? `${boardName}` : "No Board"}
                    </p>
                </div>

                <div className="chat-header-divider hide-mobile"></div>

                <div className="status-badge">
                    <span
                        className={`status-indicator ${loading ? "loading" : "ready"}`}
                    />
                    <span className="text-sm text-[var(--color-text-secondary)] font-medium">
                        {loading ? "Thinking..." : "Ready"}
                    </span>
                </div>
            </div>
        </header>
    );
};
