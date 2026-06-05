import { create } from "zustand";
import type { AuthUser, Role } from "@/types";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  hydrate: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  setUser: (user) => {
    localStorage.setItem("hotelos_token", user.token);
    localStorage.setItem("hotelos_user", JSON.stringify(user));
    set({ user });
  },

  clearUser: () => {
    localStorage.removeItem("hotelos_token");
    localStorage.removeItem("hotelos_user");
    set({ user: null });
  },

  hydrate: () => {
    try {
      const raw = localStorage.getItem("hotelos_user");
      if (raw) {
        const user: AuthUser = JSON.parse(raw);
        const expired = new Date(user.expiresAt) < new Date();
        if (!expired) {
          set({ user, isLoading: false });
          return;
        }
      }
    } catch {
      // ignore corrupt storage
    }
    set({ isLoading: false });
  },

  hasRole: (...roles) => {
    const { user } = get();
    return user !== null && roles.includes(user.role);
  },
}));
