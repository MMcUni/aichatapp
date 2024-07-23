import { useEffect, useState, useCallback } from "react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from "./components/common/ErrorBoundary";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import List from "./components/list/List";
import Login from "./components/login/Login";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import { useUserStore } from "./store/userStore";
import { useChatStore } from "./store/chatStore";
import { useAuthStore } from "./store/authStore";
import ErrorHandler from "./utils/errorHandler";

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
          ErrorHandler.handle(error, 'Logout process');
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
        }).catch((error) => {
          ErrorHandler.handle(error, 'Fetching user info');
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
    <ErrorBoundary>
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