import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./services/firebase";
import { useUserStore } from "./store/userStore";
import { useChatStore } from "./store/chatStore";
import { useAuthStore } from "./store/authStore";
import ErrorHandler from "./utils/errorHandler";
import { log, error } from "./utils/logger";
import ReminderHandler from "./components/reminder/reminderHandler";
import { disableNetwork, enableNetwork } from "firebase/firestore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo, logout: logoutUser } = useUserStore();
  const { chatId, resetChat } = useChatStore();
  const { isAuthenticated, setIsAuthenticated } = useAuthStore();
  const [showComponents, setShowComponents] = useState(false);

  const handleLogout = useCallback(async () => {
    log("Logout process started");
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setShowComponents(false);
      resetChat();
      logoutUser();
      await disableNetwork(db);
      log("Logged out successfully");
    } catch (error) {
      ErrorHandler.handle(error, "Logout process");
    }
  }, [resetChat, logoutUser, setIsAuthenticated]);

  useEffect(() => {
    log("Setting up auth state listener");
    const unSub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        log("User logged in, enabling network and fetching user info");
        try {
          await enableNetwork(db);
          await fetchUserInfo(user.uid);
          log("User info fetched, showing components");
          setIsAuthenticated(true);
          setShowComponents(true);
        } catch (error) {
          ErrorHandler.handle(error, "Fetching user info");
        }
      } else {
        log("Auth state changed to logged out");
        setIsAuthenticated(false);
        setShowComponents(false);
        logoutUser();
        resetChat();
      }
    });

    return () => {
      log("Cleaning up auth state listener");
      unSub();
    };
  }, [fetchUserInfo, logoutUser, resetChat, setIsAuthenticated]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <ErrorBoundary>
      <div className="container">
        {isAuthenticated && showComponents && currentUser ? (
          <>
            <ReminderHandler />
            <List />
            {chatId && <Chat />}
            {chatId && <Detail handleLogout={handleLogout} />}
          </>
        ) : (
          <Login />
        )}
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;