import React from "react";
import { format } from "timeago.js";
import styles from "./Message.module.css";

// Message component for displaying individual messages
const Message = ({ message, toggleAudio, isPlaying }) => {
  const { id, text, img, createdAt, type, audioUrl, isOwn } = message;

  // Handle click event for voice messages
  const handleClick = () => {
    if (type === "voice" && audioUrl) {
      toggleAudio(id, audioUrl);
    }
  };

  return (
    <div
      className={`${styles.message} ${isOwn ? styles.own : ""} ${
        type === "voice" ? styles.voiceMessage : ""
      } ${isPlaying ? styles.playing : ""}`}
      onClick={handleClick}
    >
      <div className={styles.texts}>
        {/* Message text */}
        <p>{text}</p>
        {/* Image attachment */}
        {img && (
          <img
            src={img}
            alt="Message attachment"
            onError={(e) => {
              console.log("Error loading image, removing element");
              e.target.style.display = "none";
            }}
          />
        )}
        {/* Timestamp */}
        <span>{format(createdAt)}</span>
      </div>
      {/* Audio indicator for voice messages */}
      {type === "voice" && (
        <div className={styles.audioIndicator}>{isPlaying ? "🔊" : "🔇"}</div>
      )}
    </div>
  );
};

export default React.memo(Message);
