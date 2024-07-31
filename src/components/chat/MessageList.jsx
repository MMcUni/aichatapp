import React from 'react';
import Message from './Message';

const MessageList = ({ messages, toggleAudio, playingMessageId }) => (
  <div className="center">
    {messages.map(message => (
      <Message 
        key={message.id} 
        message={message} 
        toggleAudio={toggleAudio}
        isPlaying={playingMessageId === message.id}
      />
    ))}
  </div>
);