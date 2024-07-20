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

const MAX_CONTEXT_LENGTH = 10; // Maximum number of messages to keep in context

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [context, setContext] = useState([]);

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
    
    if (chatId && isAuthenticated && user) {
      let chatDocId;
      
      const setupChatListener = (docId) => {
        console.log("Setting up chat listener for:", docId);
        unsubscribeRef.current = onSnapshot(doc(db, "chats", docId), (res) => {
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
      };

      if (user.isAI) {
        // Check for both old and new format
        const oldFormatId = `ai-assistant-${currentUser.id}`;
        const newFormatId = `ai-assistant-${user.id}-${currentUser.id}`;
        
        const checkChatExists = async (id) => {
          const docRef = doc(db, "chats", id);
          const docSnap = await getDoc(docRef);
          return docSnap.exists();
        };
        
        (async () => {
          if (await checkChatExists(oldFormatId)) {
            chatDocId = oldFormatId;
          } else {
            chatDocId = newFormatId;
          }
          setupChatListener(chatDocId);
        })();
      } else {
        chatDocId = chatId;
        setupChatListener(chatDocId);
      }
    }

    return cleanupListeners;
  }, [chatId, user, currentUser, isAuthenticated, cleanupListeners]);

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };


  const updateContext = useCallback((newMessage) => {
    setContext(prevContext => {
      const updatedContext = [...prevContext, newMessage].slice(-MAX_CONTEXT_LENGTH);
      return updatedContext;
    });
  }, []);

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

      let chatDocId;
      if (user.isAI) {
        chatDocId = `ai-assistant-${user.id}-${currentUser.id}`;
      } else {
        chatDocId = chatId;
      }

      console.log("Chat document ID:", chatDocId);

      const chatRef = doc(db, "chats", chatDocId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        console.log("Chat document doesn't exist. Creating new one.");
        await setDoc(chatRef, { messages: [newMessage], context: [newMessage] });
        setContext([newMessage]);
      } else {
        console.log("Updating chat document with new message.");
        const existingMessages = chatDoc.data().messages || [];
        const existingContext = chatDoc.data().context || [];
        const updatedContext = [...existingContext, newMessage].slice(-MAX_CONTEXT_LENGTH);
        await updateDoc(chatRef, {
          messages: [...existingMessages, newMessage],
          context: updatedContext
        });
        setContext(updatedContext);
      }

      updateContext(newMessage);

      let lastMessageText = text;

      if (user.isAI) {
        console.log(`AI user detected. Fetching ${user.username}'s response.`);
        const aiResponse = await getChatGPTResponse(
          text,
          user.specialization,
          currentUser.username,
          context
        );
        console.log(`${user.username}'s response received:`, aiResponse);
        const aiMessage = {
          senderId: user.id,
          text: aiResponse,
          createdAt: new Date().toISOString(),
        };
        console.log("Updating chat document with AI response.");
        const updatedChatDoc = await getDoc(chatRef);
        const updatedMessages = updatedChatDoc.data().messages || [];
        const updatedContext = [
          ...(updatedChatDoc.data().context || []),
          aiMessage,
        ].slice(-MAX_CONTEXT_LENGTH);
        await updateDoc(chatRef, {
          messages: [...updatedMessages, aiMessage],
          context: updatedContext,
        });
        updateContext(aiMessage);
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
            receiverId: user.id,
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

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username || "AI Assistant"}</span>
            <p>{user?.isAI ? `AI ${user.specialization} Assistant` : "Online"}</p>
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
              : `Ask ${user?.username || 'AI Assistant'} a question...`
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