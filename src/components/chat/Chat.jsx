import React, { useState, useEffect } from 'react';
import useChat from './useChat';
import ChatHeader from './ChatHeader';
import Message from './Message';
import ChatInput from './ChatInput';
import styles from './Chat.module.css';

const Chat = () => {
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

  const handleSendWithHistory = async () => {
    if (user?.specialization === 'companionship') {
      await handleSend(messages);
    } else {
      await handleSend();
    }
  };

  return (
    <div className={styles.chat}>
      <ChatHeader 
        user={user}
        isAudioEnabled={isAudioEnabled}
        enableAudio={enableAudio}
      />
      <div className={styles.center} ref={chatContainerRef}>
        {messages.map(message => (
          <Message 
            key={message.uniqueKey}
            message={message}
            toggleAudio={toggleAudio}
            isPlaying={playingMessageId === message.id}
          />
        ))}
        <div ref={endRef} />
      </div>
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