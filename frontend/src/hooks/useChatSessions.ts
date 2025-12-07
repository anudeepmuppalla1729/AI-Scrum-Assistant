import { create } from 'zustand';
import type { ChatSession } from '../types/chat.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

interface ChatStore {
    sessions: ChatSession[];
    activeSessionId: string | null;
    isLoadingSessions: boolean;

    loadSessions: (token: string) => Promise<void>;
    createSession: (token: string) => Promise<string | null>;
    deleteSession: (sessionId: string, token: string) => Promise<void>;
    renameSession: (sessionId: string, newTitle: string, token: string) => Promise<void>;
    setActiveSession: (sessionId: string | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    sessions: [],
    activeSessionId: null,
    isLoadingSessions: false,

    loadSessions: async (token: string) => {
        set({ isLoadingSessions: true });
        try {
            const res = await fetch(`${API_BASE_URL}/scrum/chat/sessions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                set({ sessions: data });
            }
        } catch (err) {
            console.error("Failed to load sessions", err);
        } finally {
            set({ isLoadingSessions: false });
        }
    },

    createSession: async (token: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/scrum/chat/session`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const newSession = await res.json();
                set((state) => ({
                    sessions: [newSession, ...state.sessions],
                    activeSessionId: newSession._id
                }));
                return newSession._id;
            }
        } catch (err) {
            console.error("Failed to create session", err);
        }
        return null;
    },

    deleteSession: async (sessionId: string, token: string) => {
        try {
            // Optimistic update
            set((state) => ({
                sessions: state.sessions.filter((s) => s._id !== sessionId),
                activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
            }));

            await fetch(`${API_BASE_URL}/scrum/chat/session/${sessionId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error("Failed to delete session", err);
            // Could revert here if needed
        }
    },

    renameSession: async (sessionId: string, newTitle: string, token: string) => {
        try {
            set((state) => ({
                sessions: state.sessions.map((s) =>
                    s._id === sessionId ? { ...s, title: newTitle } : s
                )
            }));

            await fetch(`${API_BASE_URL}/scrum/chat/session/${sessionId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ title: newTitle })
            });
        } catch (err) {
            console.error("Failed to rename session", err);
        }
    },

    setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
}));
