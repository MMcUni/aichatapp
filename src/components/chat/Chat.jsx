import { useEffect, useRef, useState, useCallback } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { useAuthStore } from "../../lib/authStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import { getChatGPTResponse } from "../../lib/chatgptService";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const { isAuthenticated } = useAuthStore();

  const endRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const cleanupListeners = useCallback(() => {
    console.log("Cleaning up listeners in Chat");
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      cleanupListeners();
    }
  }, [isAuthenticated, cleanupListeners]);

  useEffect(() => {
    console.log("Chat component useEffect triggered. ChatId:", chatId);
    
    if (chatId && isAuthenticated) {
      const chatDocId = user.isAI ? `ai-assistant-${currentUser.id}` : chatId;
      
      console.log("Setting up chat listener for:", chatDocId);
      unsubscribeRef.current = onSnapshot(doc(db, "chats", chatDocId), (res) => {
        if (isAuthenticated) {
          console.log("Chat snapshot received:", res.data());
          if (res.exists()) {
            setMessages(res.data().messages || []);
          } else {
            setMessages([]);
          }
        }
      }, (error) => {
        console.error("Error in chat snapshot:", error);
      });
    }

    return cleanupListeners;
  }, [chatId, user, currentUser, isAuthenticated, cleanupListeners]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    console.log("handleSend triggered. Text:", text);
    if (text === "") return;

    let imgUrl = null;

    try {
      if (img.file) {
        console.log("Uploading image...");
        imgUrl = await upload(img.file);
        console.log("Image uploaded. URL:", imgUrl);
      }

      const currentTime = new Date().toISOString();

      const newMessage = {
        senderId: currentUser.id,
        text,
        createdAt: currentTime,
        ...(imgUrl && { img: imgUrl }),
      };

      console.log("New message object:", newMessage);

      // Use the user-specific AI assistant chat ID
      const chatDocId = user.isAI ? `ai-assistant-${currentUser.id}` : chatId;
      console.log("Chat document ID:", chatDocId);

      const chatRef = doc(db, "chats", chatDocId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        console.log("Chat document doesn't exist. Creating new one.");
        await setDoc(chatRef, { messages: [newMessage] });
      } else {
        console.log("Updating chat document with new message.");
        const existingMessages = chatDoc.data().messages || [];
        await updateDoc(chatRef, {
          messages: [...existingMessages, newMessage],
        });
      }

      let lastMessageText = text;

      if (user.isAI) {
        console.log("AI user detected. Fetching Doctor Tom's response.");
        const aiResponse = await getChatGPTResponse(text, "medical");
        console.log("Doctor Tom's response received:", aiResponse);
        const aiMessage = {
          senderId: user.id,
          text: aiResponse,
          createdAt: new Date().toISOString(),
        };
        console.log("Updating chat document with AI response.");
        const updatedChatDoc = await getDoc(chatRef);
        const updatedMessages = updatedChatDoc.data().messages || [];
        await updateDoc(chatRef, {
          messages: [...updatedMessages, aiMessage],
        });
        lastMessageText = aiResponse;
      }

      console.log("Updating last message for current user.");
      const userChatsRef = doc(db, "userchats", currentUser.id);
      const userChatsSnapshot = await getDoc(userChatsRef);

      if (userChatsSnapshot.exists()) {
        const userChatsData = userChatsSnapshot.data();
        let chatIndex = userChatsData.chats.findIndex(
          (c) => c.chatId === chatDocId
        );

        if (chatIndex === -1 && user.isAI) {
          // If AI chat doesn't exist, add it
          userChatsData.chats.push({
            chatId: chatDocId,
            receiverId: "doctor-tom",
            lastMessage: "",
            updatedAt: currentTime,
          });
          chatIndex = userChatsData.chats.length - 1;
        }

        if (chatIndex !== -1) {
          // Remove the chat from its current position
          const updatedChat = userChatsData.chats.splice(chatIndex, 1)[0];

          // Update the chat with new information
          updatedChat.lastMessage = lastMessageText;
          updatedChat.updatedAt = currentTime;

          // Add the updated chat to the beginning of the array
          userChatsData.chats.unshift(updatedChat);

          await updateDoc(userChatsRef, {
            chats: userChatsData.chats,
          });
        } else {
          console.error("Chat not found in userChats document");
        }
      } else {
        console.error("UserChats document does not exist");
      }

      console.log("Message sent successfully.");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setImg({
        file: null,
        url: "",
      });

      setText("");
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./doctor-avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username || "Doctor Tom"}</span>
            <p>{user?.isAI ? "AI Medical Assistant" : "Online"}</p>
          </div>
        </div>
      </div>
      <div className="center">
        {messages.map((message, index) => (
          <div
            className={
              message.senderId === currentUser.id ? "message own" : "message"
            }
            key={index}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="" />}
              <p>{message.text}</p>
              <span>{format(new Date(message.createdAt))}</span>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Ask Doctor Tom a medical question..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;