
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, enableIndexedDbPersistence } from 'firebase/firestore';

export const appId = 'abfit-elite-production';

const getFirebaseConfig = () => {
  const win = window as any;
  // Fallback seguro para o Project ID para evitar caminhos como "projects//databases"
  const projectId = appId; 
  
  return {
      apiKey: process.env.API_KEY || (win.process?.env?.API_KEY) || "",
      authDomain: `${projectId}.firebaseapp.com`,
      projectId: projectId,
      storageBucket: `${projectId}.appspot.com`,
      messagingSenderId: "123456789",
      appId: `1:${projectId}:web:123456`
  };
};

const app = initializeApp(getFirebaseConfig());
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

enableIndexedDbPersistence(db).catch(() => {});
