import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// Firebase konfigürasyonu - google-services.json'dan alındı
const firebaseConfig = {
  apiKey: "AIzaSyBbXE8wdDyaipQwS5ZbfIeWHWwtO9P1qiA",
  authDomain: "isinolsun-5aa3f.firebaseapp.com",
  projectId: "isinolsun-5aa3f",
  storageBucket: "isinolsun-5aa3f.firebasestorage.app",
  messagingSenderId: "653698538472",
  appId: "1:653698538472:android:e2ecb937bf24f521e2a25d",
  databaseURL: "https://isinolsun-5aa3f-default-rtdb.firebaseio.com"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

export default app;
