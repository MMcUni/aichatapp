import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../services/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import upload from "../../utils/upload";
import ErrorHandler from "../../utils/errorHandler";
import { getFirestore, enableNetwork } from "firebase/firestore";

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });

  const [loading, setLoading] = useState(false);

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
  
    const { username, email, password } = Object.fromEntries(formData);
  
    if (!username || !email || !password) {
      toast.warn("Please fill in all fields.");
      setLoading(false);
      return;
    }
    if (!avatar.file) {
      toast.warn("Please upload an avatar.");
      setLoading(false);
      return;
    }
  
    let user = null;
  
    try {
      // Enable Firestore network connection
      await enableNetwork(db);

      // Create user with Firebase Authentication first
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;

      // Check if username already exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await user.delete(); // Delete the auth user if username exists
        toast.warn("Username is already taken. Please choose another.");
        setLoading(false);
        return;
      }
  
      // Upload avatar
      let imgUrl = await upload(avatar.file);
  
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        avatar: imgUrl,
        id: user.uid,
        blocked: [],
      });
  
      // Create userchats document
      await setDoc(doc(db, "userchats", user.uid), {
        chats: [],
      });
  
      toast.success("Account created successfully! You can now log in.");
    } catch (err) {
      ErrorHandler.handle(err, 'User registration');
      // If an error occurred after user creation, delete the user
      if (user) {
        try {
          await user.delete();
        } catch (deleteError) {
          ErrorHandler.handle(deleteError, 'Deleting user after failed registration');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    if (!email || !password) {
      toast.warn("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully!");
    } catch (err) {
      // Let ErrorHandler handle the error message
      ErrorHandler.handle(err, 'User login');
      // Remove the additional toast.error call
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Welcome back,</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" name="email" required />
          <input type="password" placeholder="Password" name="password" required />
          <button disabled={loading}>{loading ? "Logging in..." : "Sign In"}</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.png"} alt="Avatar" />
            Upload an image
          </label>
          <input
            type="file"
            id="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatar}
          />
          <input type="text" placeholder="Username" name="username" required />
          <input type="email" placeholder="Email" name="email" required />
          <input type="password" placeholder="Password" name="password" required />
          <button disabled={loading}>{loading ? "Creating Account..." : "Sign Up"}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;