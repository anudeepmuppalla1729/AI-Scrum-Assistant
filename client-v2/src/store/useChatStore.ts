import { create } from "zustand";
import type { ChatSession } from "../types";
import * as chatApi from "../api/chat";

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  loaded: boolean;

  loadSessions: (boardId?: string) => Promise<void>;
  createSession: (boardId?: string) => Promise<ChatSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  setActiveSession: (sessionId: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  loaded: false,

  loadSessions: async (boardId) => {
    if (get().loaded) return;
    set({ isLoading: true });
    try {
      const sessions = await chatApi.getChatSessions(boardId);
      set({ sessions, loaded: true });
    } catch {
      // silent fail
    } finally {
      set({ isLoading: false });
    }
  },

  createSession: async (boardId) => {
    const session = await chatApi.createChatSession(boardId);
    set((s) => ({ sessions: [session, ...s.sessions], activeSessionId: session._id }));
    return session;
  },

  deleteSession: async (sessionId) => {
    await chatApi.deleteChatSession(sessionId);
    set((s) => {
      const sessions = s.sessions.filter((x) => x._id !== sessionId);
      const activeSessionId =
        s.activeSessionId === sessionId
          ? sessions[0]?._id ?? null
          : s.activeSessionId;
      return { sessions, activeSessionId };
    });
  },

  renameSession: async (sessionId, title) => {
    await chatApi.renameChatSession(sessionId, title);
    set((s) => ({
      sessions: s.sessions.map((x) =>
        x._id === sessionId ? { ...x, title } : x
      ),
    }));
  },

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
}));
