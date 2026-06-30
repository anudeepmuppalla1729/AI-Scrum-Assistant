import React, { type MouseEvent } from "react";
import type { ChatSession } from "../../types/chat.types";

interface ChatSidebarItemProps {
    session: ChatSession;
    isActive: boolean;
    onClick: () => void;
    onDelete: (e: MouseEvent) => void;
    onRename: (newTitle: string) => void;
}

const ChatSidebarItem: React.FC<ChatSidebarItemProps> = ({ session, isActive, onClick, onDelete, onRename }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editTitle, setEditTitle] = React.useState(session.title);

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRename(editTitle);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') setIsEditing(false);
    };

    return (
        <div
            onClick={onClick}
            className={`sidebar-item group relative mb-1 ${isActive ? "sidebar-item-active" : ""}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9 7.5h19.5M4.5 3h15a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 19.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 5.4-5.492a11.165 11.165 0 0 1 2.133-2.133 9.697 9.697 0 0 1 5.967-2.133 8.1 8.1 0 0 1 3.3.693" />
            </svg>

            {isEditing ? (
                <form onSubmit={handleEditSubmit} className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                    <input
                        autoFocus
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-accent)] rounded px-2 py-0.5 text-sm outline-none shadow-[var(--shadow-accent-glow)]"
                    />
                </form>
            ) : (
                <span className="text-truncate flex-1">{session.title}</span>
            )}

            {/* Actions (visible on hover or active) */}
            {!isEditing && (
                <div className="sidebar-item-actions">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="btn-icon-sm text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
                        title="Rename"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                    <button
                        onClick={onDelete}
                        className="btn-icon-sm text-[var(--color-text-tertiary)] hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)]"
                        title="Delete"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ChatSidebarItem;
