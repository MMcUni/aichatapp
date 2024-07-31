import React, { useEffect, useRef, useState, useMemo } from "react";
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
import {
  parseReminderInput,
  formatReminderResponse,
} from "../../utils/reminderParser";
import { useReminderStore } from "../../store/reminderStore";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [open, setOpen] = useState(false);
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState(null);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();
  const { addReminder } = useReminderStore();

  const endRef = useRef(null);
  const chatContainerRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);

  const enableAudio = () => {
    setIsAudioEnabled(true);
    console.log("Audio playback enabled");
    toast.success("Audio playback enabled!");
  };

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
  }, [chatId]);

  useEffect(() => {
    console.log("Messages updated, current count:", messages.length);
    if (messages.length > prevMessagesLengthRef.current) {
      const latestMessage = messages[messages.length - 1];
      console.log("Latest message:", latestMessage);
      if (latestMessage.senderId !== currentUser.id && latestMessage.audioUrl) {
        console.log("Attempting to play audio for new AI message");
        playAudioFromUrl(latestMessage.id, latestMessage.audioUrl);
      }
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, currentUser.id]);

  const scrollToBottom = () => {
    if (endRef.current) {
      setTimeout(() => {
        endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  };

  const playAudioFromUrl = (messageId, url) => {
    console.log(`Attempting to play audio for message ${messageId}`);
    if (!isAudioEnabled) {
      console.log("Audio not enabled, enabling now");
      enableAudio();
    }

    if (currentlyPlayingAudio) {
      console.log("Stopping currently playing audio");
      currentlyPlayingAudio.pause();
    }

    const audio = new Audio(url);
    audio.oncanplaythrough = () => {
      console.log("Audio can play through, attempting to play");
      audio
        .play()
        .then(() => {
          console.log("Audio playback started successfully");
          setPlayingMessageId(messageId);
          setCurrentlyPlayingAudio(audio);
        })
        .catch((e) => {
          console.error("Error playing audio:", e);
          toast.error("Failed to play audio. Please try again.");
        });
    };
    audio.onended = () => {
      console.log("Audio playback ended");
      setPlayingMessageId(null);
      setCurrentlyPlayingAudio(null);
    };
    audio.onerror = (e) => console.error("Error loading audio:", e);
  };

  const toggleAudio = (messageId, audioUrl) => {
    console.log(`Toggling audio for message ${messageId}`);
    if (playingMessageId === messageId && currentlyPlayingAudio) {
      if (currentlyPlayingAudio.paused) {
        console.log("Resuming paused audio");
        currentlyPlayingAudio.play();
      } else {
        console.log("Pausing playing audio");
        currentlyPlayingAudio.pause();
      }
    } else {
      console.log("Playing new audio");
      playAudioFromUrl(messageId, audioUrl);
    }
  };

  const handleSend = async () => {
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
        let aiResponse;
        if (user.specialization === "medication_reminders") {
          const parsedReminder = parseReminderInput(text);
          if (parsedReminder.medication && parsedReminder.time) {
            try {
              await addReminder(currentUser.id, parsedReminder);
              aiResponse = formatReminderResponse(parsedReminder);
            } catch (reminderError) {
              error("Error adding reminder:", reminderError);
              aiResponse =
                "I'm sorry, there was an error setting your reminder. Please try again.";
            }
          } else {
            aiResponse =
              "I'm sorry, I couldn't understand your reminder request. Please try again with a medication name and time.";
          }
        } else {
          aiResponse = await getAIResponse(
            text,
            user.specialization,
            currentUser.username
          );
        }

        if (aiResponse) {
          const audioUrl = await generateAudio(aiResponse, user.id);
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
        } else {
          error("No AI response received");
          toast.error("Failed to get AI response. Please try again.");
        }
      }
    } catch (err) {
      ErrorHandler.handle(err, "Sending message or getting AI response");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
    const uniqueKey = `${message.id || message.createdAt}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return (
      <div
        className={`message ${isOwn ? "own" : ""} ${
          message.type === "voice" ? "voice-message" : ""
        }`}
        key={uniqueKey}
        onClick={() =>
          message.type === "voice" && toggleAudio(message.id, message.audioUrl)
        }
      >
        <div className="texts">
          <p>{message.text}</p>
          {message.img && (
            <img
              src={message.img}
              alt=""
              onError={(e) => {
                log("Error loading image, removing element");
                e.target.parentNode.removeChild(e.target);
              }}
            />
          )}
          <span>{format(message.createdAt)}</span>
        </div>
        <div
          className={`message ${isOwn ? "own" : ""} ${
            message.type === "voice" ? "voice-message" : ""
          } ${playingMessageId === message.id ? "playing" : ""}`}
          key={uniqueKey}
          onClick={() =>
            message.type === "voice" &&
            toggleAudio(message.id, message.audioUrl)
          }
        ></div>
      </div>
    );
  };

  const memoizedMessages = useMemo(
    () => messages.map(renderMessage),
    [messages, currentUser.id, playingMessageId]
  );

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>
              {user?.isAI ? `AI ${user.specialization} Assistant` : "Online"}
            </p>
          </div>
        </div>
        {!isAudioEnabled && (
          <button onClick={enableAudio} className="enable-audio-button">
            Enable Audio
          </button>
        )}
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
              : `Ask ${user?.username || "AI Assistant"} a question...`
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
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
