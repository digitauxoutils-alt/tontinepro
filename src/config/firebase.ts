// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAfV6oQ14l_tkhdkJFItzgutjOj2qNoKGI",
  authDomain: "tontine-2ce3c.firebaseapp.com",
  projectId: "tontine-2ce3c",
  storageBucket: "tontine-2ce3c.firebasestorage.app",
  messagingSenderId: "129830172178",
  appId: "1:129830172178:web:987fb6bcfae30e655fcacb",
  measurementId: "G-XM5127CB1S"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;