// The project uses an "importmap" in index.html to load Firebase scripts.
// We must use the v8 compatibility syntax to match those scripts.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth'; // Imports the auth service for its side effects
import 'firebase/compat/firestore'; // <<< --- ADD THIS LINE to import the Firestore service

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDoT2-rABlpCN_GsUSkwvSWWhmQzkFHhk",
  authDomain: "mcq-generator-js-corp.firebaseapp.com",
  projectId: "mcq-generator-js-corp",
  storageBucket: "mcq-generator-js-corp.firebasestorage.app",
  messagingSenderId: "778290772323",
  appId: "1:778290772323:web:435bf23c5110bd52c47b56"
};

// Initialize Firebase only if it hasn't been initialized yet.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export the auth service using the v8 compatibility syntax.
export const auth = firebase.auth();

// Export the Firestore database service using the v8 compatibility syntax.
export const db = firebase.firestore(); // <<< --- ADD THIS LINE to create and export 'db'