import { useEffect, useState, useCallback } from "react";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useUserStore } from "./lib/userStore";
import { useChatStore } from "./lib/chatStore";
import { useAuthStore } from "./lib/authStore";

// TODO: Known issue - "Missing or insufficient permissions" error occurs after logout.
// This doesn't affect core functionality but should be investigated in the future if time permits.
// Potential areas to look into: listener cleanup, Firebase SDK version, security rules.

const App = () => {
  const { currentUser, isLoading, fetchUserInfo, logout } = useUserStore();
  const { chatId, resetChat } = useChatStore();
  const { isAuthenticated, setIsAuthenticated } = useAuthStore();
  const [showComponents, setShowComponents] = useState(false);

  const handleLogout = useCallback(() => {
    console.log("Logout process started");
    setIsAuthenticated(false);
    setShowComponents(false);
    
    setTimeout(() => {
      console.log("Resetting chat and user state");
      resetChat();
      logout();
      
      setTimeout(() => {
        console.log("Signing out from Firebase");
        auth.signOut().then(() => {
          console.log("Logged out successfully from App");
        }).catch((error) => {
          console.error("Error during logout from App:", error);
        });
      }, 1000);
    }, 500);
  }, [resetChat, logout, setIsAuthenticated]);

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unSub = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User logged in, fetching user info");
        fetchUserInfo(user.uid).then(() => {
          console.log("User info fetched, showing components");
          setIsAuthenticated(true);
          setShowComponents(true);
        });
      } else {
        console.log("Auth state changed to logged out");
        setIsAuthenticated(false);
        setShowComponents(false);
        logout();
        resetChat();
      }
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unSub();
    };
  }, [fetchUserInfo, logout, resetChat, setIsAuthenticated]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      {currentUser && showComponents && isAuthenticated ? (
        <>
          <List />
          {chatId && <Chat />}
          {chatId && <Detail handleLogout={handleLogout} />}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;