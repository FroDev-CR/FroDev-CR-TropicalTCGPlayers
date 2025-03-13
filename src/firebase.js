// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBlUcQayBNnslKhJ5bCw21HWDHn7AlXdAw",
  authDomain: "tropical-tcg-players-5a199.firebaseapp.com",
  projectId: "tropical-tcg-players-5a199",
  storageBucket: "tropical-tcg-players-5a199.firebasestorage.app",
  messagingSenderId: "943837881919",
  appId: "1:943837881919:web:471ae207891d2f07837a8a",
  measurementId: "G-V4BRPDYE31"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
