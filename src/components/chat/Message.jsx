import React from 'react';
import { format } from "timeago.js";
import styles from './Message.module.css';

const Message = ({ message, toggleAudio, isPlaying }) => {
  const {
    id,
    text,
    img,
    createdAt,
    type,
    audioUrl,
    isOwn,
  } = message;

  const handleClick = () => {
    if (type === 'voice' && audioUrl) {
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
        <p>{text}</p>
        {img && (
          <img
            src={img}
            alt="Message attachment"
            onError={(e) => {
              console.log("Error loading image, removing element");
              e.target.style.display = 'none';
            }}
          />
        )}
        <span>{format(createdAt)}</span>
      </div>
      {type === 'voice' && (
        <div className={styles.audioIndicator}>
          {isPlaying ? '🔊' : '🔇'}
        </div>
      )}
    </div>
  );
};

export default React.memo(Message);