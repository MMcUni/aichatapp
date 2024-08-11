import React from "react";
import EmojiPicker from "emoji-picker-react";
import VoiceInteraction from "../common/VoiceInteraction";
import styles from "./ChatInput.module.css";

// ChatInput component for user input and message sending
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
  user,
}) => {
  return (
    <div className={styles.bottom}>
      {/* File upload and voice interaction */}
      <div className={styles.icons}>
        <label htmlFor="file" className={styles.iconWrapper}>
          <img src="/img.png" alt="Upload image" className={styles.icon} />
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
      {/* Text input */}
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
      {/* Emoji picker */}
      <div className={styles.emoji}>
        <img
          src="/emoji.png"
          alt="Emoji"
          onClick={() => setOpen((prev) => !prev)}
          className={styles.emojiIcon}
        />
        {open && (
          <div className={styles.picker}>
            <EmojiPicker
              onEmojiClick={(emojiObject) => handleEmoji(emojiObject)}
            />
          </div>
        )}
      </div>
      {/* Send button */}
      <button
        className={styles.sendButton}
        onClick={handleSend}
        disabled={isBlocked || (!text.trim() && !img.file)}
      >
        Send
      </button>
      {/* Image preview */}
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
