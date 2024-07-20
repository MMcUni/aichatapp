import React, { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";
import { format } from "timeago.js";
import VoiceInteraction from "../VoiceInteraction";
import { getAIResponse } from "../../lib/api";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [open, setOpen] = useState(false);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, addMessage } = useChatStore();

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
      }
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
    console.log("handleSend called");
    if (text.trim() === "" && !img.file) return;

    let imgUrl = null;
    if (img.file) {
      imgUrl = await upload(img.file);
    }

    const message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text,
      img: imgUrl,
      createdAt: new Date().toISOString(),
    };

    console.log("Sending message:", message);

    await addMessage(message);

    console.log("Message added to Firestore");

    if (user.isAI) {
      console.log("Generating AI response");
      try {
        const aiResponse = await getAIResponse(text, user.id, currentUser.username);
        console.log("AI response received:", aiResponse);

        const aiMessage = {
          id: Date.now().toString(),
          senderId: user.id,
          text: aiResponse,
          createdAt: new Date().toISOString(),
        };

        await addMessage(aiMessage);
        console.log("AI message added to Firestore");
      } catch (error) {
        console.error("Error generating AI response:", error);
      }
    }

    setText("");
    setImg({ file: null, url: "" });
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
      <div className={`message ${isOwn ? "own" : ""}`} key={message.id}>
        <div className="texts">
          {message.type === 'voice' ? (
            <>
              <audio src={message.audioUrl} controls />
              <p>{message.text}</p>
            </>
          ) : message.img ? (
            <img src={message.img} alt="" />
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