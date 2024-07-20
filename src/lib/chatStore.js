import { create } from "zustand";
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useUserStore } from "./userStore";

export const useChatStore = create((set, get) => ({
  chatId: null,
  user: null,
  messages: [],
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  changeChat: async (chatId, user) => {
    console.log("Changing chat to:", chatId, user);
    const currentUser = useUserStore.getState().currentUser;

    // Check if current user is blocked
    if (user.blocked && user.blocked.includes(currentUser.id)) {
      console.log("Current user is blocked");
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
      console.log("Receiver is blocked");
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

      console.log("Chat changed successfully");
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

  addMessage: async (message) => {
    const { chatId } = get();
    if (!chatId) {
      console.error("No chatId available");
      return;
    }

    console.log("Adding message to chat:", chatId, message);

    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        messages: arrayUnion(message)
      });

      console.log("Message added to Firestore");

      // Update local state
      set((state) => ({
        messages: [...state.messages, message]
      }));

      console.log("Local state updated");

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
            console.log("User chats updated for", userId);
          }
        }
      };

      await updateLastMessage(currentUser.id, user.id);
      if (!user.isAI) {
        await updateLastMessage(user.id, currentUser.id);
      }

    } catch (error) {
      console.error("Error adding message to Firestore:", error);
    }
  },

  changeBlock: () => {
    set((state) => ({ 
      ...state, 
      isReceiverBlocked: !state.isReceiverBlocked 
    }));
  },

  resetChat: () => {
    console.log("Resetting chat");
    set({
      chatId: null,
      user: null,
      messages: [],
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
}));