import React from "react";
import styles from "./ChatHeader.module.css";

// ChatHeader component for displaying user info and audio control
const ChatHeader = ({ user, isAudioEnabled, enableAudio }) => {
  return (
    <div className={styles.top}>
      {/* User information */}
      <div className={styles.user}>
        <img src={user?.avatar || "./avatar.png"} alt="User avatar" />
        <div className={styles.texts}>
          <span>{user?.username}</span>
          <p>{user?.isAI ? `AI ${user.specialization} Assistant` : "Online"}</p>
        </div>
      </div>
      {/* Audio enable button */}
      {!isAudioEnabled && (
        <button onClick={enableAudio} className={styles.enableAudioButton}>
          Enable Audio
        </button>
      )}
    </div>
  );
};

export default ChatHeader;
