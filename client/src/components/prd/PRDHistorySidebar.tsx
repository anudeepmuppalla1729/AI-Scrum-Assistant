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
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
                <button
                    onClick={handleCreateNew}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                >
                    <span>+ New PRD</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
                {sessions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">
                        No previous PRDs found.
                    </div>
                ) : (
                    <ul className="space-y-1 px-2">
                        {sessions.map((session) => (
                            <li key={session._id}>
                                <button
                                    onClick={() => navigate(`/prd/${session._id}`)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm group flex items-center justify-between ${activeSessionId === session._id
                                            ? "bg-blue-50 text-blue-700 font-medium"
                                            : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    <span className="truncate">{session.title || "Untitled PRD"}</span>

                                    <span
                                        onClick={(e) => handleDelete(e, session._id)}
                                        className={`p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
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
