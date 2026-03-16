import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
    apiKey: 'AIzaSyAhXESlxFbkbzcWS9m54gcB1MMj9SWhLo4',
    authDomain: 'khrogetna.firebaseapp.com',
    projectId: 'khrogetna',
    storageBucket: 'khrogetna.firebasestorage.app',
    messagingSenderId: '969132303004',
    appId: '1:969132303004:web:694a32313674d671c48359'
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const storage = getStorage(app);
