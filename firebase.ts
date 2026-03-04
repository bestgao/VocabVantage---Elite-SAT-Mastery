import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmC-B9FiJvdE3k9lTldUy6g39dbE-p3Q0",
  authDomain: "vocabvantage-0126.firebaseapp.com",
  projectId: "vocabvantage-0126",
  storageBucket: "vocabvantage-0126.firebasestorage.app",
  messagingSenderId: "784621615529",
  appId: "1:784621615529:web:84296551db6a30c0fd2cb8",
  measurementId: "G-DDPEFK9MGY"
};

console.log("Initializing Firebase with Project ID:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
console.log("Firebase Auth & Firestore initialized.");
