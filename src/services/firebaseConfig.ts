import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyAhXESlxFbkbzcWS9m54gcB1MMj9SWhLo4",
    authDomain: "khrogetna.firebaseapp.com",
    projectId: "khrogetna",
    storageBucket: "khrogetna.firebasestorage.app",
    messagingSenderId: "969132303004",
    appId: "1:969132303004:web:694a32313674d671c48359"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
