import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  arrayRemove,
  arrayUnion,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { useChatStore } from "../../store/chatStore";
import { db } from "../../services/firebase";
import { useUserStore } from "../../store/userStore";
import { useAuthStore } from "../../store/authStore";
import "./detail.css";
import { log } from "../../utils/logger";
import AI_AGENT_TAGLINES from "../constants/aiAgentTaglines";

const Detail = ({ handleLogout }) => {
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock } =
    useChatStore();
  const { currentUser } = useUserStore();
  const { isAuthenticated } = useAuthStore();
  const [userDetails, setUserDetails] = useState(null);
  const unsubscribeRef = useRef(null);

  const cleanupListeners = useCallback(() => {
    log("Cleaning up listeners in Detail");
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      cleanupListeners();
    }
  }, [isAuthenticated, cleanupListeners]);

  useEffect(() => {
    log("Setting up user details listener");

    if (user && currentUser && isAuthenticated) {
      log("Setting up new listener");
      const userDocRef = doc(db, "users", user.id);
      unsubscribeRef.current = onSnapshot(
        userDocRef,
        (doc) => {
          if (isAuthenticated && doc.exists()) {
            log("Received user details update");
            setUserDetails(doc.data());
          }
        },
        (error) => {
          console.error("Error fetching user details:", error);
        }
      );
    }

    return cleanupListeners;
  }, [user, currentUser, isAuthenticated, cleanupListeners]);

  const handleBlock = async () => {
    if (!user || !currentUser) return;

    const userDocRef = doc(db, "users", currentUser.id);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      log(err);
    }
  };

  const renderPhotoItem = (photoUrl, photoName) => (
    <div className="photoItem" key={photoName}>
      <div className="photoDetail">
        <img src={photoUrl} alt={photoName} />
        <span>{photoName}</span>
      </div>
      <img src="./download.png" alt="Download" className="icon" />
    </div>
  );

  return (
    <div className="detail">
      <div className="user">
        <img
          src={user?.avatar || "./avatar.png"}
          alt={user?.username || "User avatar"}
        />
        <h2>{user?.username}</h2>
        <p>{user?.isAI ? AI_AGENT_TAGLINES[user.id] : "User bio goes here"}</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img src="./arrowUp.png" alt="Expand" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy & Help</span>
            <img src="./arrowUp.png" alt="Expand" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Photos</span>
            <img src="./arrowDown.png" alt="Collapse" />
          </div>
          <div className="photos">
            {[1, 2, 3, 4].map((index) =>
              renderPhotoItem(
                "https://images.pexels.com/photos/7381200/pexels-photo-7381200.jpeg?auto=compress&cs=tinysrgb&w=800&lazy=load",
                `photo_2024_${index}.png`
              )
            )}
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="./arrowUp.png" alt="Expand" />
          </div>
        </div>
        {!user?.isAI && (
          <button onClick={handleBlock}>
            {isCurrentUserBlocked
              ? "You are Blocked!"
              : isReceiverBlocked
              ? "Unblock User"
              : "Block User"}
          </button>
        )}
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;
