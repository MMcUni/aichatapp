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
import { useState } from "react";
import { useUserStore } from "../../../../store/userStore";

const AI_AGENTS = [
  {
    id: "doctor-tom",
    username: "Doctor Tom",
    avatar: "./ai-doctor.png",
    isAI: true,
    specialization: "medical",
  },
  {
    id: "walter-weather",
    username: "Walter Weather",
    avatar: "./ai-weather.png",
    isAI: true,
    specialization: "weather",
  },
  {
    id: "dave-entertainer",
    username: "Dave the Entertainer",
    avatar: "./ai-entertainer.png",
    isAI: true,
    specialization: "entertainment",
  },
];

const AddUser = ({ setChats }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setUser(null);
    setSearchPerformed(true);
    const formData = new FormData(e.target);
    const username = formData.get("username");

    const aiAgent = AI_AGENTS.find(agent => agent.username.toLowerCase() === username.toLowerCase());
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
        console.log(err);
        setError("An error occurred while searching");
      }
    }
  };

  const handleAdd = async () => {
    if (!user) return;
  
    const chatId = user.isAI ? `ai-assistant-${user.id}-${currentUser.id}` : (
      currentUser.id > user.id
        ? currentUser.id + user.id
        : user.id + currentUser.id
    );
  
    try {
      const chatDocRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatDocRef);
  
      if (!chatDoc.exists()) {
        // Create a chat in chats collection
        await setDoc(chatDocRef, { messages: [] });
  
        const currentTime = new Date().toISOString();
  
        // Update userChats for current user
        const currentUserChatsRef = doc(db, "userchats", currentUser.id);
        const currentUserChatsDoc = await getDoc(currentUserChatsRef);
        
        if (currentUserChatsDoc.exists()) {
          const currentUserChats = currentUserChatsDoc.data().chats || [];
          if (!currentUserChats.some(chat => chat.chatId === chatId)) {
            await updateDoc(currentUserChatsRef, {
              chats: arrayUnion({
                chatId: chatId,
                receiverId: user.id,
                lastMessage: "",
                updatedAt: currentTime,
              }),
            });
          }
        } else {
          await setDoc(currentUserChatsRef, {
            chats: [{
              chatId: chatId,
              receiverId: user.id,
              lastMessage: "",
              updatedAt: currentTime,
            }],
          });
        }
  
        // We don't need to update userChats for AI assistant
        if (!user.isAI) {
          const userChatsRef = doc(db, "userchats", user.id);
          const userChatsDoc = await getDoc(userChatsRef);
          
          if (userChatsDoc.exists()) {
            const userChats = userChatsDoc.data().chats || [];
            if (!userChats.some(chat => chat.chatId === chatId)) {
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
              chats: [{
                chatId: chatId,
                receiverId: currentUser.id,
                lastMessage: "",
                updatedAt: currentTime,
              }],
            });
          }
        }
  
        // Update local state
        setChats((prevChats) => {
          if (!prevChats.some(chat => chat.chatId === chatId)) {
            return [
              {
                chatId: chatId,
                receiverId: user.id,
                lastMessage: "",
                updatedAt: currentTime,
                user: {
                  id: user.id,
                  username: user.username,
                  avatar: user.avatar,
                  isAI: user.isAI,
                  specialization: user.specialization,
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
      console.log(err);
      setError("An error occurred while adding the user");
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username or AI Agent Name" name="username" />
        <button>Search</button>
      </form>
      {error && <p className="error">{error}</p>}
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
      {searchPerformed && !user && !error && (
        <div className="ai-agents">
          <h3>Available AI Agents:</h3>
          <ul>
            {AI_AGENTS.map((agent) => (
              <li key={agent.id} onClick={() => setUser(agent)}>
                <img src={agent.avatar} alt={agent.username} />
                <span>{agent.username}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddUser;