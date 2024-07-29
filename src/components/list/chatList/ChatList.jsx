import React, { useEffect, useState, useRef } from "react";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../store/userStore";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
} from "firebase/firestore";
import { db } from "../../../services/firebase";
import { useChatStore } from "../../../store/chatStore";
import { format } from "timeago.js";
import { AI_AGENTS } from "../../../components/constants/aiAgents";
import { log, error, warn, info } from "../../../utils/logger";
import { useAuthStore } from "../../../store/authStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const { isAuthenticated } = useAuthStore();

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  const unsubscribeRefs = useRef([]);

  const truncateMessage = (message, maxLength = 30) => {
    if (message.length <= maxLength) return message;
    return message.substr(0, maxLength - 3) + "...";
  };

  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUser || !currentUser.id || !isAuthenticated) {
        log("No current user or not authenticated");
        return;
      }

      log("Fetching chats for user:", currentUser.id);

      const userChatsRef = doc(db, "userchats", currentUser.id);
      const chatsCollectionRef = collection(db, "chats");

      try {
        const unSubUserChats = onSnapshot(
          userChatsRef,
          async (userChatsDoc) => {
            log("User chats snapshot received:", userChatsDoc.data());
            const userChatsData = userChatsDoc.data()?.chats || [];

            if (userChatsData.length === 0) {
              log("No chats found for user");
              setChats([]);
              return;
            }

            const chatPromises = userChatsData.map(async (chatItem) => {
              log("Processing chat item:", chatItem);
              if (chatItem.chatId.startsWith("ai-assistant")) {
                log("AI assistant chat detected:", chatItem.chatId);
                const aiId = chatItem.receiverId;
                const aiAgent = AI_AGENTS[aiId];
                if (aiAgent) {
                  return {
                    ...chatItem,
                    user: aiAgent,
                  };
                } else {
                  console.error("Unknown AI agent:", aiId);
                  return null;
                }
              } else if (!chatItem.receiverId) {
                console.error("Invalid chat item (no receiverId):", chatItem);
                return null;
              } else {
                try {
                  const userDocRef = doc(db, "users", chatItem.receiverId);
                  const userDocSnap = await getDoc(userDocRef);

                  if (!userDocSnap.exists()) {
                    console.error(
                      "User document does not exist for receiverId:",
                      chatItem.receiverId
                    );
                    return null;
                  }

                  const userData = userDocSnap.data();
                  log(
                    "User data fetched for receiverId:",
                    chatItem.receiverId,
                    userData
                  );
                  return { ...chatItem, user: userData };
                } catch (error) {
                  console.error("Error fetching user data:", error);
                  return null;
                }
              }
            });

            const resolvedChats = (await Promise.all(chatPromises)).filter(
              Boolean
            );
            log("Resolved chats:", resolvedChats);

            resolvedChats.forEach((chat) => {
              const chatDocRef = doc(chatsCollectionRef, chat.chatId);
              onSnapshot(chatDocRef, (chatDoc) => {
                if (chatDoc.exists()) {
                  const chatData = chatDoc.data();
                  log("Chat data received:", chat.chatId, chatData);
                  const messages = chatData.messages || [];
                  const lastMessage =
                    messages.length > 0 ? messages[messages.length - 1] : null;
                  setChats((prevChats) => {
                    const updatedChats = prevChats.map((prevChat) =>
                      prevChat.chatId === chat.chatId
                        ? {
                            ...prevChat,
                            lastMessage: lastMessage
                              ? truncateMessage(lastMessage.text)
                              : "No messages yet",
                            updatedAt: lastMessage
                              ? new Date(lastMessage.createdAt).getTime()
                              : prevChat.updatedAt,
                          }
                        : prevChat
                    );
                    return updatedChats.sort(
                      (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
                    );
                  });
                } else {
                  log("Chat document does not exist:", chat.chatId);
                }
              });
            });

            setChats(
              resolvedChats.sort(
                (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
              )
            );
          }
        );

        return () => {
          log("Cleaning up ChatList effect");
          unsubscribeRefs.current.forEach(unsub => unsub());
          unsubscribeRefs.current = [];
        };
      } catch (error) {
        console.error("Error in fetchChats:", error);
      }
    };

    if (currentUser && isAuthenticated) {
      fetchChats();
    }

    return () => {
      log("Cleaning up ChatList component");
      unsubscribeRefs.current.forEach(unsub => unsub());
      unsubscribeRefs.current = [];
    };
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      log("Authentication state changed, cleaning up ChatList listeners");
      unsubscribeRefs.current.forEach(unsub => unsub());
      unsubscribeRefs.current = [];
    }
  }, [isAuthenticated]);

  const handleSelect = async (chat) => {
    log("Selecting chat:", chat);

    if (!chat || !chat.chatId) {
      console.error("Invalid chat selected");
      return;
    }

    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    if (chatIndex === -1) {
      console.error("Chat not found in the list");
      return;
    }

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      log("Updating chat:", chat.chatId, chat.user);
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.error("Error updating chat selection:", err);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user?.username?.toLowerCase().includes(input.toLowerCase())
  );

  log("Rendered chats:", filteredChats);

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {filteredChats.length === 0 && <div>No chats available</div>}
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
            cursor: "pointer",
          }}
        >
          <img
            src={
              chat.user?.blocked?.includes(currentUser.id)
                ? "./avatar.png"
                : chat.user?.avatar || "./avatar.png"
            }
            alt="avatar"
          />
          <div className="texts">
            <span>
              {chat.user?.blocked?.includes(currentUser.id)
                ? "User"
                : chat.user?.username}
            </span>
            <p>{chat.lastMessage || "No messages yet"}</p>
            <small>
              {chat.updatedAt ? format(new Date(chat.updatedAt)) : "Unknown"}
            </small>
          </div>
        </div>
      ))}

      {addMode && <AddUser setChats={setChats} />}
    </div>
  );
};

export default ChatList;
