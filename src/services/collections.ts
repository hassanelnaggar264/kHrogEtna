import { collection, CollectionReference, DocumentData } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { User, Business, Rating, Follow } from '../types/schema';

// Helper to create strictly typed collection references
const createCollection = <T = DocumentData>(collectionName: string) => {
  return collection(db, collectionName) as CollectionReference<T>;
};

// Typed Collections
export const usersCollection = createCollection<User>('users');
export const businessesCollection = createCollection<Business>('businesses');
export const ratingsCollection = createCollection<Rating>('ratings');
export const followsCollection = createCollection<Follow>('follows');
