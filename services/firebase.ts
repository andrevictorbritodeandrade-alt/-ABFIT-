
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, enableIndexedDbPersistence } from 'firebase/firestore';

// Função para obter a configuração do Firebase via variáveis de ambiente ou objeto global
const getFirebaseConfig = () => {
  const win = window as any;
  if (typeof win !== 'undefined' && win.__firebase_config && win.__firebase_config.apiKey) {
    return win.__firebase_config;
  }
  
  return {
      apiKey: process.env.API_KEY || win.process?.env?.API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID
  };
};

const app = initializeApp(getFirebaseConfig());

export const auth = getAuth(app);

// Inicializa o Firestore com cache ilimitado para suportar uso offline extensivo
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Ativa a persistência offline (IndexedDB)
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Múltiplas abas abertas, a persistência só funciona em uma por vez.
        console.warn("Persistência do Firestore falhou: Múltiplas abas detectadas.");
    } else if (err.code === 'unimplemented') {
        // O navegador não suporta a funcionalidade.
        console.warn("Persistência do Firestore não suportada pelo navegador.");
    }
});

export const appId = (typeof window !== 'undefined' && (window as any).__app_id) ? (window as any).__app_id : 'abfit-elite-production';
