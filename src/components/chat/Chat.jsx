import React, { useRef, useState, useEffect } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useChatStore } from "../../lib/chatStore";

const Chat = () => {
  const [chat, setChat] = useState();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { chatId } = useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "chats", "chatId"),
      (res) => {
        setChat(res.data());
      }
    );

    return () => {
      unSub();
    };
  }, [chatId]);

  console.log(chat);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  return (
    <div className="chat">
      <header className="top">
        <div className="user">
          <img src="./avatar.png" alt="User Avatar" />
          <div className="texts">
            <span>Jane Doe</span>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone Icon" />
          <img src="./video.png" alt="Video Icon" />
          <img src="./info.png" alt="Info Icon" />
        </div>
      </header>
      <div className="center">
        <div className="message own">
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nobis
              molestias velit eos assumenda officiis sed ducimus beatae nisi
              voluptates. Nihil cupiditate laudantium quia recusandae et
              repellendus, tenetur sed odit repellat!
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nobis
              molestias velit eos assumenda officiis sed ducimus beatae nisi
              voluptates. Nihil cupiditate laudantium quia recusandae et
              repellendus, tenetur sed odit repellat!
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message own">
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nobis
              molestias velit eos assumenda officiis sed ducimus beatae nisi
              voluptates. Nihil cupiditate laudantium quia recusandae et
              repellendus, tenetur sed odit repellat!
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message">
          <img src="./avatar.png" alt="" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nobis
              molestias velit eos assumenda officiis sed ducimus beatae nisi
              voluptates. Nihil cupiditate laudantium quia recusandae et
              repellendus, tenetur sed odit repellat!
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message own">
          <div className="texts">
            <img src="https://metamma.com/assets/logo-ee5194e7.svg" alt="" />
            <p>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Nobis
              molestias velit eos assumenda officiis sed ducimus beatae nisi
              voluptates. Nihil cupiditate laudantium quia recusandae et
              repellendus, tenetur sed odit repellat!
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div ref={endRef}></div>
      </div>
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
          {open && (
            <div className="picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button className="sendButton">Send</button>
      </footer>
    </div>
  );
};

export default Chat;