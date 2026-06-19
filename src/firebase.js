// src/firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAndOX44oCPYXjfsmuykZmNPFEEvPB5mm0",
  authDomain: "codershubtest.firebaseapp.com",
  projectId: "codershubtest",
  storageBucket: "codershubtest.firebasestorage.app",
  messagingSenderId: "523364703687",
  appId: "1:523364703687:web:c1a481f8385de748b1cde2",
  measurementId: "G-KQ6XT03T1R"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
