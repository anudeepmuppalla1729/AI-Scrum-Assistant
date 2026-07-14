import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

function isTokenValid(token: string): boolean {
  try {
    const part = token.split(".")[1];
    if (!part) return false;
    const payload = JSON.parse(atob(part));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: (() => {
    const stored = localStorage.getItem("token");
    if (stored && isTokenValid(stored)) return stored;
    localStorage.removeItem("token");
    return null;
  })(),

  setToken: (token) => {
    if (isTokenValid(token)) {
      localStorage.setItem("token", token);
      set({ token });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cloudId");
    set({ token: null });
  },

  isAuthenticated: () => {
    const token = get().token;
    return !!token && isTokenValid(token);
  },
}));
