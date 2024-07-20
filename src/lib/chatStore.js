import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  messages: [],
  
  changeChat: (chatId, user) => {
    console.log("Changing chat to:", chatId, user);
    const currentUser = useUserStore.getState().currentUser;

    // CHECK IF CURRENT USER IS BLOCKED
    if (user.blocked && user.blocked.includes(currentUser.id)) {
      console.log("Current user is blocked");
      return set({
        chatId,
        user: null,
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
      });
    }

    // CHECK IF RECEIVER IS BLOCKED
    if (currentUser.blocked && currentUser.blocked.includes(user.id)) {
      console.log("Receiver is blocked");
      return set({
        chatId,
        user: user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
      });
    }

    console.log("Chat changed successfully");
    return set({
      chatId,
      user,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
      messages: [], // Reset messages when changing chat
    });
  },

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  changeBlock: () => {
    set((state) => ({ ...state, isReceiverBlocked: !state.isReceiverBlocked }));
  },

  resetChat: () => {
    console.log("Resetting chat");
    set({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
      messages: [],
    });
  },
}));
