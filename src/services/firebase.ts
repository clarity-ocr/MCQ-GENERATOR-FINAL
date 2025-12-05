import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAHVTUv4mRz8jTRfIqL5JmdyZhkyE5Oyq0",
  authDomain: "quizapo-ai.firebaseapp.com",
  projectId: "quizapo-ai",
  storageBucket: "quizapo-ai.firebasestorage.app",
  messagingSenderId: "837481826446",
  appId: "1:837481826446:web:eec0c95b4c90fa490861df",
  measurementId: "G-5V4TY11C27"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);