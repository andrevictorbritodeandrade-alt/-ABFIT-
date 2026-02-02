
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, enableIndexedDbPersistence } from 'firebase/firestore';

// ID do projeto atualizado para a nova configuração
export const appId = 'chaveunica-225e0';

const firebaseConfig = {
  apiKey: "AIzaSyD_C_yn_RyBSopY7Tb9aqLW8akkXJR94Vg",
  authDomain: "chaveunica-225e0.firebaseapp.com",
  projectId: "chaveunica-225e0",
  storageBucket: "chaveunica-225e0.firebasestorage.app",
  messagingSenderId: "324211037832",
  appId: "1:324211037832:web:362a46e6446ea37b85b13d",
  measurementId: "G-MRBDJC3QXZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Inicializa o Firestore com cache ilimitado para suportar funcionamento offline robusto
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Habilita a persistência offline para evitar perda de dados
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Persistência offline falhou: Multiplas abas abertas.');
    } else if (err.code == 'unimplemented') {
        console.warn('Persistência offline não suportada neste navegador.');
    }
});
