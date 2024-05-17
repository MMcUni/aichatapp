import React, { useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";

const Chat = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false)
  };

  return (
    <div className="chat">
      <header className="top">
        <div className="user">
          <img src="./avatar.png" alt="User Avatar" />
          <div className="texts">
            <span className="user-name">Jane Doe</span>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone Icon" />
          <img src="./video.png" alt="Video Icon" />
          <img src="./info.png" alt="Info Icon" />
        </div>
      </header>
      <main className="center">{/* Add your main chat content here */}</main>
      <footer className="bottom">
        <div className="icons">
          <img src="./img.png" alt="Image Icon" />
          <img src="./camera.png" alt="Camera Icon" />
          <img src="./mic.png" alt="Microphone Icon" />
        </div>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt="Emoji Icon"
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker"><EmojiPicker open={open} onEmojiClick={handleEmoji} /></div>
          
        </div>
        <button className="sendButton">Send</button>
      </footer>
    </div>
  );
};

export default Chat;
