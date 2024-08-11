import React from "react";
import useChat from "./useChat";
import ChatHeader from "./ChatHeader";
import Message from "./Message";
import ChatInput from "./ChatInput";
import styles from "./Chat.module.css";

// Main Chat component
const Chat = () => {
  // Destructure all necessary states and functions from useChat hook
  const {
    messages,
    text,
    setText,
    img,
    setImg,
    open,
    setOpen,
    isAudioEnabled,
    enableAudio,
    playingMessageId,
    user,
    isCurrentUserBlocked,
    isReceiverBlocked,
    endRef,
    chatContainerRef,
    handleSend,
    handleKeyPress,
    handleImg,
    handleEmoji,
    toggleAudio,
  } = useChat();

  // Handle sending messages with or without chat history
  const handleSendWithHistory = async () => {
    if (user?.specialization === "companionship") {
      await handleSend(messages);
    } else {
      await handleSend();
    }
  };

  return (
    <div className={styles.chat}>
      {/* Chat header component */}
      <ChatHeader
        user={user}
        isAudioEnabled={isAudioEnabled}
        enableAudio={enableAudio}
      />
      {/* Message list */}
      <div className={styles.center} ref={chatContainerRef}>
        {messages.map((message) => (
          <Message
            key={message.uniqueKey}
            message={message}
            toggleAudio={toggleAudio}
            isPlaying={playingMessageId === message.id}
          />
        ))}
        <div ref={endRef} />
      </div>
      {/* Chat input component */}
      <ChatInput
        text={text}
        setText={setText}
        img={img}
        setImg={setImg}
        open={open}
        setOpen={setOpen}
        handleSend={handleSendWithHistory}
        handleKeyPress={(e) => handleKeyPress(e, messages)}
        handleImg={handleImg}
        handleEmoji={handleEmoji}
        isBlocked={isCurrentUserBlocked || isReceiverBlocked}
        user={user}
      />
    </div>
  );
};

export default Chat;
