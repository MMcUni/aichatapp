import React, { useState, useEffect } from "react";
import "./addUser.css";
import { db } from "../../../../services/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useUserStore } from "../../../../store/userStore";
import { AI_AGENTS } from "../../../constants/aiAgents";
import { log, error } from "../../../../utils/logger";

const AddUser = ({ setChats }) => {
  // State declarations
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Store hooks
  const { currentUser } = useUserStore();

  // Effect to fetch available users
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const querySnapshot = await getDocs(usersRef);
        const users = querySnapshot.docs
          .map((doc) => doc.data())
          .filter((user) => user.id !== currentUser.id); // Exclude current user
        setAvailableUsers(users);
      } catch (err) {
        console.error("Error fetching available users:", err);
      }
    };

    fetchAvailableUsers();
  }, [currentUser.id]);

  // Handle user search
  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setUser(null);
    setSearchPerformed(true);
    const formData = new FormData(e.target);
    const username = formData.get("username");

    const aiAgent = Object.values(AI_AGENTS).find(
      (agent) => agent.username.toLowerCase() === username.toLowerCase()
    );
    if (aiAgent) {
      setUser(aiAgent);
    } else {
      try {
        const userRef = collection(db, "users");
        const q = query(userRef, where("username", "==", username));
        const querySnapShot = await getDocs(q);
        if (!querySnapShot.empty) {
          setUser(querySnapShot.docs[0].data());
        } else {
          setError("User not found");
        }
      } catch (err) {
        log(err);
        setError("An error occurred while searching");
      }
    }
  };

  // Handle adding a user or AI agent
  const handleAdd = async (selectedUser) => {
    const userToAdd = selectedUser || user;
    if (!userToAdd) return;

    const chatId = userToAdd.isAI
      ? `ai-assistant-${userToAdd.id}-${currentUser.id}`
      : currentUser.id > userToAdd.id
      ? currentUser.id + userToAdd.id
      : userToAdd.id + currentUser.id;

    try {
      const chatDocRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatDocRef);

      if (!chatDoc.exists()) {
        await setDoc(chatDocRef, { messages: [] });

        const currentTime = new Date().toISOString();

        const currentUserChatsRef = doc(db, "userchats", currentUser.id);
        const currentUserChatsDoc = await getDoc(currentUserChatsRef);

        if (currentUserChatsDoc.exists()) {
          const currentUserChats = currentUserChatsDoc.data().chats || [];
          if (!currentUserChats.some((chat) => chat.chatId === chatId)) {
            await updateDoc(currentUserChatsRef, {
              chats: arrayUnion({
                chatId: chatId,
                receiverId: userToAdd.id,
                lastMessage: "",
                updatedAt: currentTime,
              }),
            });
          }
        } else {
          await setDoc(currentUserChatsRef, {
            chats: [
              {
                chatId: chatId,
                receiverId: userToAdd.id,
                lastMessage: "",
                updatedAt: currentTime,
              },
            ],
          });
        }

        if (!userToAdd.isAI) {
          const userChatsRef = doc(db, "userchats", userToAdd.id);
          const userChatsDoc = await getDoc(userChatsRef);

          if (userChatsDoc.exists()) {
            const userChats = userChatsDoc.data().chats || [];
            if (!userChats.some((chat) => chat.chatId === chatId)) {
              await updateDoc(userChatsRef, {
                chats: arrayUnion({
                  chatId: chatId,
                  receiverId: currentUser.id,
                  lastMessage: "",
                  updatedAt: currentTime,
                }),
              });
            }
          } else {
            await setDoc(userChatsRef, {
              chats: [
                {
                  chatId: chatId,
                  receiverId: currentUser.id,
                  lastMessage: "",
                  updatedAt: currentTime,
                },
              ],
            });
          }
        }

        setChats((prevChats) => {
          if (!prevChats.some((chat) => chat.chatId === chatId)) {
            return [
              {
                chatId: chatId,
                receiverId: userToAdd.id,
                lastMessage: "",
                updatedAt: currentTime,
                user: {
                  id: userToAdd.id,
                  username: userToAdd.username,
                  avatar: userToAdd.avatar,
                  isAI: userToAdd.isAI,
                  specialization: userToAdd.specialization,
                },
              },
              ...prevChats,
            ];
          }
          return prevChats;
        });

        setUser(null);
        setSearchPerformed(false);
      } else {
        setError("Chat already exists");
      }
    } catch (err) {
      log(err);
      setError("An error occurred while adding the user");
    }
  };

  return (
    <div className="addUser">
      {/* Search form */}
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Username or AI Agent Name"
          name="username"
        />
        <button>Search</button>
      </form>

      {/* Error message */}
      {error && <p className="error">{error}</p>}

      {/* Search result */}
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={() => handleAdd()}>Add User</button>
        </div>
      )}

      {/* Available human users */}
      <div className="available-users">
        <h3>Available Human Users:</h3>
        <ul>
          {availableUsers.map((user) => (
            <li key={user.id} onClick={() => handleAdd(user)}>
              <img src={user.avatar || "./avatar.png"} alt={user.username} />
              <span>{user.username}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Available AI agents */}
      <div className="ai-agents">
        <h3>Available AI Agents:</h3>
        <ul>
          {Object.values(AI_AGENTS).map((agent) => (
            <li key={agent.id} onClick={() => handleAdd(agent)}>
              <img src={agent.avatar} alt={agent.username} />
              <span>{agent.username}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AddUser;
