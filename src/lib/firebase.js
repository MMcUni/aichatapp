import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "aichatapp-12689.firebaseapp.com",
  projectId: "aichatapp-12689",
  storageBucket: "aichatapp-12689.appspot.com",
  messagingSenderId: "479570815728",
  appId: "1:479570815728:web:a3eeb846b2091f0e25b035"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);