import React, { useEffect, useState } from "react";
import { getPRDSessions, createPRDSession, deletePRDSession } from "../../api/scrumApi";
import type { PRDSession } from "../../types/prd.types";
import { useNavigate } from "react-router-dom";

interface PRDHistorySidebarProps {
    activeSessionId?: string;
}

const PRDHistorySidebar: React.FC<PRDHistorySidebarProps> = ({ activeSessionId }) => {
    const [sessions, setSessions] = useState<PRDSession[]>([]);
    const navigate = useNavigate();

    const fetchSessions = async () => {
        try {
            const data = await getPRDSessions();
            setSessions(data);
        } catch (error) {
            console.error("Failed to load PRD sessions", error);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [activeSessionId]); // Reload when active session changes (e.g. after create/update)

    const handleCreateNew = async () => {
        try {
            const newSession = await createPRDSession({ title: "New PRD Draft" });
            navigate(`/prd/${newSession._id}`);
        } catch (error) {
            console.error("Failed to create new PRD session", error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this PRD?")) return;

        try {
            await deletePRDSession(id);
            if (activeSessionId === id) {
                navigate("/prd");
            }
            fetchSessions();
        } catch (error) {
            console.error("Failed to delete PRD session", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
            <div className="sidebar-header">
                <button
                    onClick={handleCreateNew}
                    className="btn btn-primary btn-full shadow-sm"
                >
                    <span>+ New PRD</span>
                </button>
            </div>

            <div className="sidebar-body stagger-children">
                {sessions.length === 0 ? (
                    <div className="empty-state p-4">
                        <p className="empty-state-desc">No previous PRDs found.</p>
                    </div>
                ) : (
                    <ul className="space-y-1 px-2">
                        {sessions.map((session, index) => (
                            <li key={session._id} style={{ '--index': index } as React.CSSProperties}>
                                <button
                                    onClick={() => navigate(`/prd/${session._id}`)}
                                    className={`sidebar-item group relative mb-1 w-full flex items-center justify-between text-left ${activeSessionId === session._id
                                            ? "sidebar-item-active"
                                            : ""
                                        }`}
                                >
                                    <span className="text-truncate flex-1">{session.title || "Untitled PRD"}</span>

                                    <span
                                        onClick={(e) => handleDelete(e, session._id)}
                                        className={`btn-icon-sm text-[var(--color-text-tertiary)] hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 0 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PRDHistorySidebar;
