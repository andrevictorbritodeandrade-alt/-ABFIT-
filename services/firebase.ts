import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Função para obter a configuração do Firebase via variáveis de ambiente ou objeto global
const getFirebaseConfig = () => {
  if (typeof window !== 'undefined' && window.__firebase_config && window.__firebase_config.apiKey) {
    return window.__firebase_config;
  }
  
  // Utiliza as variáveis de ambiente injetadas no processo
  return {
      apiKey: process.env.API_KEY || (window as any).process?.env?.API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID
  };
};

const app = initializeApp(getFirebaseConfig());

export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'abfit-elite-production';