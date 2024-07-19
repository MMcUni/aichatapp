import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc, collection } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";
import { format } from "timeago.js";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUser || !currentUser.id) {
        console.log("No current user");
        return;
      }

      console.log("Fetching chats for user:", currentUser.id);

      const userChatsRef = doc(db, "userchats", currentUser.id);
      const chatsCollectionRef = collection(db, "chats");

      try {
        const unSubUserChats = onSnapshot(userChatsRef, async (userChatsDoc) => {
          console.log("User chats snapshot received:", userChatsDoc.data());
          const userChatsData = userChatsDoc.data()?.chats || [];

          if (userChatsData.length === 0) {
            console.log("No chats found for user");
            setChats([]);
            return;
          }

          const chatPromises = userChatsData.map(async (chatItem) => {
            console.log("Processing chat item:", chatItem);
            if (chatItem.chatId.startsWith('ai-assistant')) {
              console.log("AI assistant chat detected:", chatItem.chatId);
              return {
                ...chatItem,
                user: {
                  id: "doctor-tom",
                  username: "Doctor Tom",
                  avatar: "./doctor-avatar.png",
                  isAI: true,
                  specialization: "medical",
                  blocked: [],
                }
              };
            } else if (!chatItem.receiverId) {
              console.error("Invalid chat item (no receiverId):", chatItem);
              return null;
            } else {
              try {
                const userDocRef = doc(db, "users", chatItem.receiverId);
                const userDocSnap = await getDoc(userDocRef);

                if (!userDocSnap.exists()) {
                  console.error("User document does not exist for receiverId:", chatItem.receiverId);
                  return null;
                }

                const userData = userDocSnap.data();
                console.log("User data fetched for receiverId:", chatItem.receiverId, userData);
                return { ...chatItem, user: userData };
              } catch (error) {
                console.error("Error fetching user data:", error);
                return null;
              }
            }
          });

          const resolvedChats = (await Promise.all(chatPromises)).filter(Boolean);
          console.log("Resolved chats:", resolvedChats);
          
          resolvedChats.forEach(chat => {
            const chatDocRef = doc(chatsCollectionRef, chat.chatId);
            onSnapshot(chatDocRef, (chatDoc) => {
              if (chatDoc.exists()) {
                const chatData = chatDoc.data();
                console.log("Chat data received:", chat.chatId, chatData);
                const messages = chatData.messages || [];
                const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
                setChats(prevChats => {
                  const updatedChats = prevChats.map(prevChat => 
                    prevChat.chatId === chat.chatId
                      ? { 
                          ...prevChat, 
                          lastMessage: lastMessage ? lastMessage.text : "No messages yet",
                          updatedAt: lastMessage ? new Date(lastMessage.createdAt).getTime() : prevChat.updatedAt
                        }
                      : prevChat
                  );
                  return updatedChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
                });
              } else {
                console.log("Chat document does not exist:", chat.chatId);
              }
            });
          });

          setChats(resolvedChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
        });

        return () => {
          console.log("Cleaning up ChatList effect");
          unSubUserChats();
        };
      } catch (error) {
        console.error("Error in fetchChats:", error);
      }
    };

    if (currentUser) {
      fetchChats();
    }
  }, [currentUser]);

  const handleSelect = async (chat) => {
    console.log("Selecting chat:", chat);
    
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
      console.log("Updating chat:", chat.chatId, chat.user);
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.error("Error updating chat selection:", err);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user?.username?.toLowerCase().includes(input.toLowerCase())
  );

  console.log("Rendered chats:", filteredChats);

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