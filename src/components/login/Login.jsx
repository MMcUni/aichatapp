import { useState } from "react";
import "./login.css";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import upload from "../../lib/upload";

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
      toast.warn("Please enter inputs!");
      setLoading(false);
      return;
    }
    if (!avatar.file) {
      toast.warn("Please upload an avatar!");
      setLoading(false);
      return;
    }
  
    let user = null;
  
    try {
      console.log("Starting registration process");
  
      // Step 1: Check if username already exists
      console.log("Checking if username exists");
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          console.log("Username already exists");
          toast.warn("Select another username");
          setLoading(false);
          return;
        }
      } catch (usernameCheckError) {
        console.error("Error checking username:", usernameCheckError);
        throw usernameCheckError;
      }
  
      // Step 2: Create user with Firebase Authentication
      console.log("Creating user with Firebase Authentication");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      console.log("User created:", user.uid);
  
      // Step 3: Upload avatar
      console.log("Uploading avatar");
      let imgUrl;
      try {
        imgUrl = await upload(avatar.file);
        console.log("Avatar uploaded, URL:", imgUrl);
      } catch (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        imgUrl = "https://example.com/default-avatar.png"; // Replace with your default avatar URL
        console.log("Using default avatar URL:", imgUrl);
      }
  
      // Step 4: Create user document in Firestore
      console.log("Creating user document in Firestore");
      try {
        await setDoc(doc(db, "users", user.uid), {
          username,
          email,
          avatar: imgUrl,
          id: user.uid,
          blocked: [],
        });
        console.log("User document created in Firestore");
      } catch (firestoreError) {
        console.error("Error creating user document:", firestoreError);
        throw firestoreError;
      }
  
      // Step 5: Create userchats document
      console.log("Creating userchats document");
      try {
        await setDoc(doc(db, "userchats", user.uid), {
          chats: [],
        });
        console.log("Userchats document created in Firestore");
      } catch (userchatsError) {
        console.error("Error creating userchats document:", userchatsError);
        throw userchatsError;
      }
  
      toast.success("Account created! You can login now!");
    } catch (err) {
      console.error("Error in registration process:", err);
      if (err.code) console.error("Error code:", err.code);
      if (err.message) console.error("Error message:", err.message);
      toast.error(err.message);
  
      // If an error occurred after user creation, delete the user
      if (user) {
        try {
          await user.delete();
          console.log("User deleted due to registration error");
        } catch (deleteError) {
          console.error("Error deleting user:", deleteError);
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
      toast.warn("Please enter both email and password!");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting to log in with email:", email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful");
    } catch (err) {
      console.error("Error during login:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="item">
        <h2>Welcome back,</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Email" name="email" required />
          <input type="password" placeholder="Password" name="password" required />
          <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
        </form>
      </div>
      <div className="separator"></div>
      <div className="item">
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.png"} alt="" />
            Upload an image
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleAvatar}
          />
          <input type="text" placeholder="Username" name="username" required />
          <input type="text" placeholder="Email" name="email" required />
          <input type="password" placeholder="Password" name="password" required />
          <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
