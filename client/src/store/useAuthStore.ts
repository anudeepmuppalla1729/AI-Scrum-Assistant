import { create } from 'zustand';

const isTokenValid = (token: string | null) => {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Check if exp exists and if it is in the past
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
};

const getInitialToken = () => {
    const token = localStorage.getItem('token');
    if (isTokenValid(token)) return token;
    localStorage.removeItem('token');
    return null;
};

interface AuthStore {
    token: string | null;
    setToken: (token: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    token: getInitialToken(),
    setToken: (token) => {
        if (token && isTokenValid(token)) {
            localStorage.setItem('token', token);
            set({ token });
        } else {
            localStorage.removeItem('token');
            set({ token: null });
        }
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ token: null });
    }
}));
