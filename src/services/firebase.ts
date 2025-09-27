import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCDoT2-rABlpCN_GsUSkwvSWWhmQzkFHhk",
  authDomain: "mcq-generator-js-corp.firebaseapp.com",
  projectId: "mcq-generator-js-corp",
  storageBucket: "mcq-generator-js-corp.appspot.com",
  messagingSenderId: "778290772323",
  appId: "1:778290772323:web:435bf23c5110bd52c47b56"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);