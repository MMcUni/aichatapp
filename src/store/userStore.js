import { doc, getDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../services/firebase";
import { log, error, warn, info } from '../utils/logger';

export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,
  fetchUserInfo: async (uid) => {
    if (!uid) return set({ currentUser: null, isLoading: false });

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({ currentUser: docSnap.data(), isLoading: false });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      log(err);
      return set({ currentUser: null, isLoading: false });
    }
  },
  resetUserInfo: () => set({ currentUser: null, isLoading: false }),
  logout: () => {
    log("Logging out user in userStore");
    set({ currentUser: null, isLoading: false });
  },
}));