
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, CACHE_SIZE_UNLIMITED, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

// ID do projeto atualizado para a nova configuração
export const appId = 'abfit-d5bff';

const firebaseConfig = {
  apiKey: "AIzaSyCZIP1JUTVXjVd6dMnd_DRTD1CLvQpqslc",
  authDomain: "abfit-d5bff.firebaseapp.com",
  projectId: "abfit-d5bff",
  storageBucket: "abfit-d5bff.firebasestorage.app",
  messagingSenderId: "565295481649",
  appId: "1:565295481649:web:cdfe52ef679b85ab362610",
  measurementId: "G-X2PK4MPTP9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Inicializa o Firestore com cache ilimitado para suportar funcionamento offline robusto
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Habilita a persistência multi-aba para evitar erros de acesso exclusivo
enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn('Persistência offline falhou: Multiplas abas abertas sem suporte multi-aba.');
    } else if (err.code == 'unimplemented') {
        console.warn('Persistência offline não suportada neste navegador.');
    } else {
        console.error('Erro ao habilitar persistência:', err);
    }
});
