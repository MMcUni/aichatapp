import React from 'react';
import styles from './ChatHeader.module.css';

const ChatHeader = ({ user, isAudioEnabled, enableAudio }) => {
  return (
    <div className={styles.top}>
      <div className={styles.user}>
        <img src={user?.avatar || "./avatar.png"} alt="User avatar" />
        <div className={styles.texts}>
          <span>{user?.username}</span>
          <p>
            {user?.isAI ? `AI ${user.specialization} Assistant` : "Online"}
          </p>
        </div>
      </div>
      {!isAudioEnabled && (
        <button onClick={enableAudio} className={styles.enableAudioButton}>
          Enable Audio
        </button>
      )}
    </div>
  );
};

export default ChatHeader;