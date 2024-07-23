import { create } from "zustand";

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  setIsAuthenticated: (status) => set({ isAuthenticated: status }),
}));