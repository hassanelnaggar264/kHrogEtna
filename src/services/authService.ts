import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { User, AccountType } from '../types/schema';

// Helper to fetch custom user document from Firestore
export const fetchUserDocument = async (uid: string): Promise<User | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocMap = await getDoc(userDocRef);
    if (userDocMap.exists()) {
      return userDocMap.data() as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user document", error);
    return null;
  }
};

// Sign Up Handler - Dual Flow
export const registerUser = async (
  email: string, 
  pass: string, 
  name: string, 
  username: string, 
  accountType: AccountType
): Promise<User> => {
  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser: FirebaseUser = userCredential.user;

  // 2. Build our explicit User schema
  const newUserDoc: User = {
    userId: fbUser.uid,
    name,
    username,
    bio: '',
    avatar: '',
    accountType,
    followersCount: 0,
    followingCount: 0,
    isFounder: false, // Default to false
    founderPicks: [],
    createdAt: serverTimestamp() as Timestamp,
  };

  // 3. Write securely to Firestore 'users' collection
  await setDoc(doc(db, 'users', fbUser.uid), newUserDoc);

  return newUserDoc;
};

// Login Handler
export const loginUser = async (email: string, pass: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const fbUser: FirebaseUser = userCredential.user;
  
  const userDoc = await fetchUserDocument(fbUser.uid);
  if (!userDoc) {
     throw new Error("User document missing in database");
  }
  return userDoc;
};

// Logout Handler
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};
