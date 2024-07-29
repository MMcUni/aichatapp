import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useChatStore } from "../../store/chatStore";
import { useUserStore } from "../../store/userStore";
import upload from "../../utils/upload";
import { format } from "timeago.js";
import VoiceInteraction from "../common/VoiceInteraction";
import ErrorHandler from "../../utils/errorHandler";
import { toast } from "react-toastify";
import { getAIResponse, generateAudio } from "../../services/api";
import { log, error } from "../../utils/logger";
import { parseReminderInput, formatReminderResponse } from "../../utils/reminderParser";
import { useReminderStore } from "../../store/reminderStore";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [open, setOpen] = useState(false);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const { addReminder } = useReminderStore();

  const endRef = useRef(null);
  const chatContainerRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    if (endRef.current) {
      setTimeout(() => {
        endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, []);

  useEffect(() => {
    log("Chat component mounted. ChatId:", chatId);
    if (!chatId) return;
    
    log("Setting up chat listener for:", chatId);
    const unSub = onSnapshot(
      doc(db, "chats", chatId),
      (doc) => {
        if (doc.exists()) {
          const newMessages = doc.data().messages || [];
          setMessages(newMessages);
          if (newMessages.length > prevMessagesLengthRef.current) {
            scrollToBottom();
          }
          prevMessagesLengthRef.current = newMessages.length;
        } else {
          log("No such document!");
          toast.error("Chat not found. Please try again.");
        }
      },
      (err) => {
        ErrorHandler.handle(err, "Fetching chat messages");
      }
    );

    return () => {
      log("Cleaning up chat listener");
      unSub();
    };
  }, [chatId, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [chatId, scrollToBottom]);

  const handleSend = useCallback(async () => {
    if (text.trim() === "" && !img.file) return;

    let imgUrl = null;
    if (img.file) {
      try {
        imgUrl = await upload(img.file);
      } catch (err) {
        ErrorHandler.handle(err, "Uploading image");
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
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(userMessage),
      });

      setText("");
      setImg({ file: null, url: "" });

      if (user?.isAI) {
        log("Generating AI response for:", user);
        
        let aiResponse;
        if (user.specialization === "medication_reminders") {
          log("Parsing reminder input:", text);
          const parsedReminder = parseReminderInput(text);
          log("Parsed reminder:", parsedReminder);
          
          if (parsedReminder.medication && parsedReminder.time) {
            log("Adding reminder for user:", currentUser.id);
            try {
              await addReminder(currentUser.id, parsedReminder);
              log("Reminder added successfully");
              aiResponse = formatReminderResponse(parsedReminder);
            } catch (reminderError) {
              error("Error adding reminder:", reminderError);
              aiResponse = "I'm sorry, there was an error setting your reminder. Please try again.";
            }
          } else {
            log("Incomplete reminder information");
            aiResponse = "I'm sorry, I couldn't understand your reminder request. Please try again with a medication name and time.";
          }
        } else {
          aiResponse = await getAIResponse(text, user.specialization, currentUser.username);
        }
        
        log("AI response received:", aiResponse);
        
        if (aiResponse) {
          log("Attempting to generate audio for response:", aiResponse);
          const audioUrl = await generateAudio(aiResponse, user.id);
          log("Audio URL received:", audioUrl);

          const aiMessage = {
            id: (Date.now() + 1).toString(),
            senderId: user.id,
            text: aiResponse,
            audioUrl: audioUrl,
            createdAt: new Date().toISOString(),
            type: "voice",
          };

          await updateDoc(doc(db, "chats", chatId), {
            messages: arrayUnion(aiMessage),
          });

          log("AI response added to chat:", aiMessage);
        } else {
          error("No AI response received");
          toast.error("Failed to get AI response. Please try again.");
        }
      }
    } catch (err) {
      ErrorHandler.handle(err, "Sending message or getting AI response");
    }
  }, [text, img, currentUser.id, chatId, user, getAIResponse, generateAudio, addReminder]);

  const handleImg = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setImg({
        file,
        url: URL.createObjectURL(file),
      });
    }
  }, []);

  const handleEmoji = useCallback((emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
  }, []);

  const renderMessage = useCallback((message) => {
    const isOwn = message.senderId === currentUser.id;
    const uniqueKey = `${message.id || message.createdAt}-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className={`message ${isOwn ? "own" : ""}`} key={uniqueKey}>
        <div className="texts">
          {message.type === "voice" ? (
            <>
              {message.audioUrl ? (
                <audio
                  src={message.audioUrl}
                  controls
                  onError={(e) => {
                    log("Error loading audio, removing element");
                    e.target.parentNode.removeChild(e.target);
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
                log("Error loading image, removing element");
                e.target.parentNode.removeChild(e.target);
              }}
            />
          ) : (
            <p>{message.text}</p>
          )}
          <span>{format(message.createdAt)}</span>
        </div>
      </div>
    );
  }, [currentUser.id]);

  const memoizedMessages = useMemo(() => messages.map(renderMessage), [messages, renderMessage]);

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
      <div className="center" ref={chatContainerRef}>
        {memoizedMessages}
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