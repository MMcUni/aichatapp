import React, { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import VoiceInteraction from "../VoiceInteraction";
import ErrorHandler from "../../lib/errorHandler";
import { toast } from "react-toastify";
import { getAIResponse } from "../../lib/api";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [open, setOpen] = useState(false);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    console.log("Chat component mounted. ChatId:", chatId);
    if (!chatId) return;
    
    console.log("Setting up chat listener for:", chatId);
    const unSub = onSnapshot(doc(db, "chats", chatId), (doc) => {
      if (doc.exists()) {
        console.log("Chat snapshot received:", doc.data());
        setMessages(doc.data().messages || []);
      } else {
        console.log("No such document!");
        toast.error("Chat not found. Please try again.");
      }
    }, (error) => {
      ErrorHandler.handle(error, 'Fetching chat messages');
    });

    return () => {
      console.log("Cleaning up chat listener");
      unSub();
    };
  }, [chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (text.trim() === "" && !img.file) return;

    let imgUrl = null;
    if (img.file) {
      try {
        imgUrl = await upload(img.file);
      } catch (error) {
        ErrorHandler.handle(error, 'Uploading image');
        return;
      }
    }

    const userMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text,
      img: imgUrl,
      createdAt: new Date().toISOString(),
    };

    try {
      // Add user message to the chat
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(userMessage)
      });

      setText("");
      setImg({ file: null, url: "" });

      // If the recipient is an AI agent, generate and add AI response
      if (user?.isAI) {
        console.log("Generating AI response for:", user.specialization);
        const aiResponse = await getAIResponse(text, user.specialization, currentUser.username);
        
        const aiMessage = {
          id: Date.now().toString(),
          senderId: user.id,
          text: aiResponse,
          createdAt: new Date().toISOString(),
        };

        await updateDoc(doc(db, "chats", chatId), {
          messages: arrayUnion(aiMessage)
        });

        console.log("AI response added to chat:", aiResponse);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'Sending message or getting AI response');
    }
  };

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImg({
        file,
        url: URL.createObjectURL(file),
      });
    }
  };

  const handleEmoji = (emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
  };

  const renderMessage = (message) => {
    const isOwn = message.senderId === currentUser.id;
    return (
      <div
        className={`message ${isOwn ? "own" : ""}`}
        key={message.id || `${message.senderId}-${message.createdAt}`}
      >
        <div className="texts">
          {message.type === "voice" ? (
            <>
              {message.audioUrl ? (
                <audio
                  src={message.audioUrl}
                  controls
                  onError={(e) => {
                    console.log("Error loading audio, likely an old message. Ignoring.");
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <p>Audio unavailable</p>
              )}
              <p>{message.text}</p>
            </>
          ) : message.img ? (
            <img
              src={message.img}
              alt=""
              onError={(e) => {
                console.log("Error loading image, likely an old message. Ignoring.");
                e.target.style.display = "none";
              }}
            />
          ) : (
            <p>{message.text}</p>
          )}
          <span>{format(message.createdAt)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>{user?.isAI ? `AI ${user.specialization} Assistant` : "Online"}</p>
          </div>
        </div>
      </div>
      <div className="center">
        {messages.map(renderMessage)}
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
          <VoiceInteraction />
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