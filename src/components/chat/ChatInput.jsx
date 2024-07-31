import React from 'react';
import EmojiPicker from "emoji-picker-react";
import VoiceInteraction from "../common/VoiceInteraction";
import styles from './ChatInput.module.css';

const ChatInput = ({ 
  text, 
  setText, 
  img, 
  setImg, 
  open, 
  setOpen,
  handleSend, 
  handleKeyPress,
  handleImg, 
  handleEmoji, 
  isBlocked, 
  user 
}) => {
  return (
    <div className={styles.bottom}>
      <div className={styles.icons}>
        <label htmlFor="file">
          <img src="./img.png" alt="Upload image" />
        </label>
        <input
          type="file"
          id="file"
          style={{ display: "none" }}
          onChange={handleImg}
          accept="image/*"
        />
        <VoiceInteraction />
      </div>
      <input
        className={styles.input}
        type="text"
        placeholder={
          isBlocked
            ? "You cannot send a message"
            : `Ask ${user?.username || "AI Assistant"} a question...`
        }
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isBlocked}
      />
      <div className={styles.emoji}>
        <img
          src="./emoji.png"
          alt="Emoji"
          onClick={() => setOpen((prev) => !prev)}
        />
        {open && (
          <div className={styles.picker}>
            <EmojiPicker onEmojiClick={(emojiObject) => handleEmoji(emojiObject)} />
          </div>
        )}
      </div>
      <button
        className={styles.sendButton}
        onClick={handleSend}
        disabled={isBlocked || (!text.trim() && !img.file)}
      >
        Send
      </button>
      {img.url && (
        <div className={styles.imagePreview}>
          <img src={img.url} alt="Upload preview" />
          <button onClick={() => setImg({ file: null, url: "" })}>❌</button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ChatInput);