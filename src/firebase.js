import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAregAr_NQ1tRyBADukY9pWAmwaWi051nI",
  authDomain: "ssvm-admin-khariar.firebaseapp.com",
  projectId: "ssvm-admin-khariar",
  storageBucket: "ssvm-admin-khariar.firebasestorage.app",
  messagingSenderId: "463815163973",
  appId: "1:463815163973:web:853ba560f48a8f20e3a32c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
