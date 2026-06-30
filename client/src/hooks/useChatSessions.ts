import { create } from "zustand";
import type { ChatSession } from "../types/chat.types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoadingSessions: boolean;
  sessionsLoaded: boolean;

  loadSessions: (token: string, boardId?: string | number | null) => Promise<void>;
  createSession: (token: string, boardId?: string | number | null) => Promise<string | null>;
  deleteSession: (sessionId: string, token: string) => Promise<void>;
  renameSession: (
    sessionId: string,
    newTitle: string,
    token: string,
  ) => Promise<void>;
  updateSessionTitleLocal: (sessionId: string, newTitle: string) => void;
  setActiveSession: (sessionId: string | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  activeSessionId: null,
  isLoadingSessions: false,
  sessionsLoaded: false,

  loadSessions: async (token: string, boardId?: string | number | null) => {
    set({ isLoadingSessions: true });
    try {
      const url = boardId 
        ? `${API_BASE_URL}/scrum/chat/sessions?boardId=${boardId}`
        : `${API_BASE_URL}/scrum/chat/sessions`;
        
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ sessions: data, sessionsLoaded: true });
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
    } finally {
      set({ isLoadingSessions: false });
    }
  },

  createSession: async (token: string, boardId?: string | number | null) => {
    try {
      const res = await fetch(`${API_BASE_URL}/scrum/chat/session`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ boardId }),
      });
      if (res.ok) {
        const newSession = await res.json();
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession._id,
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
        activeSessionId:
          state.activeSessionId === sessionId ? null : state.activeSessionId,
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
          s._id === sessionId ? { ...s, title: newTitle } : s,
        ),
      }));

      await fetch(`${API_BASE_URL}/scrum/chat/session/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (err) {
      console.error("Failed to rename session", err);
    }
  },

  updateSessionTitleLocal: (sessionId, newTitle) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s._id === sessionId ? { ...s, title: newTitle } : s,
      ),
    })),

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
}));
