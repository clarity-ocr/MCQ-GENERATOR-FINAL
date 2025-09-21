// The project uses an "importmap" in index.html to load Firebase scripts.
// We must use the v8 compatibility syntax to match those scripts.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage'; // This import enables the storage service

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDoT2-rABlpCN_GsUSkwvSWWhmQzkFHhk",
  authDomain: "mcq-generator-js-corp.firebaseapp.com",
  projectId: "mcq-generator-js-corp",
  storageBucket: "mcq-generator-js-corp.appspot.com", // Correct URL format
  messagingSenderId: "778290772323",
  appId: "1:778290772323:web:435bf23c5110bd52c47b56"
};

// Initialize Firebase only if it hasn't been initialized yet.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export the initialized services for use in other parts of your app.
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();