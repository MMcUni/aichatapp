import React from "react";
import Message from "./Message";

// MessageList component for rendering a list of messages
const MessageList = ({ messages, toggleAudio, playingMessageId }) => (
  <div className="center">
    {messages.map((message) => (
      <Message
        key={message.id}
        message={message}
        toggleAudio={toggleAudio}
        isPlaying={playingMessageId === message.id}
      />
    ))}
  </div>
);

export default MessageList;
