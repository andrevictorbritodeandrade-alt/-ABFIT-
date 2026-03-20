import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAxFmQtAjWqNoXpcGRnmAA_ouXsgw3RvT8",
  authDomain: "meus-apps---cerebro.firebaseapp.com",
  projectId: "meus-apps---cerebro",
  storageBucket: "meus-apps---cerebro.firebasestorage.app",
  messagingSenderId: "980266889768",
  appId: "1:980266889768:web:e15e1a6ac46df2faa53b1d",
  measurementId: "G-2C4DNZ5FM7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const appId = firebaseConfig.projectId;

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Firestore persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence is not supported by this browser');
    }
  });
}

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
