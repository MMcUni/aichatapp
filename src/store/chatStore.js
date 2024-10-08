import { create } from "zustand";
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useUserStore } from "./userStore";
import { log, error } from '../utils/logger';

export const useChatStore = create((set, get) => ({
  chatId: null,
  user: null,
  messages: [],
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  // Change the current chat
  changeChat: async (chatId, user) => {
    log("Changing chat to:", chatId, user);
    const currentUser = useUserStore.getState().currentUser;

    // Check if current user is blocked
    if (user.blocked && user.blocked.includes(currentUser.id)) {
      log("Current user is blocked");
      set({
        chatId,
        user: null,
        messages: [],
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
      });
      return;
    }

    // Check if receiver is blocked
    if (currentUser.blocked && currentUser.blocked.includes(user.id)) {
      log("Receiver is blocked");
      set({
        chatId,
        user,
        messages: [],
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
      });
      return;
    }

    // Fetch messages from Firestore
    try {
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      let messages = [];
      if (chatDoc.exists()) {
        messages = chatDoc.data().messages || [];
      } else {
        // If chat document doesn't exist, create it
        await setDoc(doc(db, "chats", chatId), { messages: [] });
      }

      log("Chat changed successfully");
      set({
        chatId,
        user,
        messages,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  },

  // Add a new message to the chat
  addMessage: async (message, specificChatId = null) => {
    const chatId = specificChatId || get().chatId;
    if (!chatId) {
      console.error("No chatId available");
      return;
    }

    log("Adding message to chat:", chatId, message);

    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        messages: arrayUnion(message)
      });

      log("Message added to Firestore");

      // Update local state only if it's the current chat
      if (chatId === get().chatId) {
        set((state) => ({
          messages: [...state.messages, message]
        }));
        log("Local state updated");
      }

      // Update last message in userchats collection
      const currentUser = useUserStore.getState().currentUser;
      const { user } = get();
      
      const updateLastMessage = async (userId, otherUserId) => {
        const userChatsRef = doc(db, "userchats", userId);
        const userChatsDoc = await getDoc(userChatsRef);
        if (userChatsDoc.exists()) {
          const userChats = userChatsDoc.data().chats || [];
          const chatIndex = userChats.findIndex(chat => chat.chatId === chatId);
          if (chatIndex !== -1) {
            userChats[chatIndex] = {
              ...userChats[chatIndex],
              lastMessage: message.text,
              updatedAt: new Date().toISOString()
            };
            await updateDoc(userChatsRef, { chats: userChats });
            log("User chats updated for", userId);
          }
        }
      };

      await updateLastMessage(currentUser.id, user?.id || message.senderId);
      if (!user?.isAI && user?.id !== message.senderId) {
        await updateLastMessage(user?.id || message.senderId, currentUser.id);
      }

    } catch (error) {
      console.error("Error adding message to Firestore:", error);
    }
  },

  // Toggle block status
  changeBlock: () => {
    set((state) => ({ 
      ...state, 
      isReceiverBlocked: !state.isReceiverBlocked 
    }));
  },

  // Reset chat state
  resetChat: () => {
    log("Resetting chat and cleaning up listeners");
    // Add this line to forcefully disable all active listeners
    if (window.firebase && window.firebase.firestore) {
      window.firebase.firestore().disableNetwork();
    }
    set({
      chatId: null,
      user: null,
      messages: [],
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
}));