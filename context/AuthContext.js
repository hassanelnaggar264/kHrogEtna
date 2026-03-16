import { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebaseConfig';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    deleteUser
} from 'firebase/auth';
import { UserService } from '../services/UserService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                // User is signed in, fetch additional profile data (role, etc.)
                try {
                    const profileData = await UserService.getUserProfile(authUser.uid);
                    // Merge Auth User + Firestore Profile
                    setUser({ ...authUser, ...profileData });
                } catch (error) {
                    console.error("Error fetching user profile in context:", error);
                    setUser(authUser); // Fallback to basic auth user
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signup = async (email, password, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        setUser({ ...userCredential.user, displayName: name }); // Force local update
        return userCredential;
    };

    const logout = () => {
        return signOut(auth);
    };

    const deleteAccount = async () => {
        if (!user) return;
        try {
            // 1. Delete Firestore Data
            await UserService.deleteUserData(user.uid);

            // 2. Delete Auth User
            await deleteUser(user);
            setUser(null);
        } catch (error) {
            console.error("Error deleting account: ", error);
            throw error;
        }
    };

    // Google Sign-In Placeholder logic (requires configuration)
    // For now, we will add the function signature for context consumers.
    // In a real app, this would use promptAsync from useAuthRequest.
    const signInWithGoogle = async (idToken) => {
        // Implementation depends heavily on Expo configuration (scheme, slug).
        // For this task, we'll setup the structure.
        try {
            const { GoogleAuthProvider, signInWithCredential } = require('firebase/auth');
            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, credential);
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            throw error;
        }
    };

    const reloadUser = async () => {
        try {
            if (auth.currentUser) {
                await auth.currentUser.reload();
                // We should probably re-fetch profile here too ideally, but for now just auth
                const profileData = await UserService.getUserProfile(auth.currentUser.uid);
                setUser({ ...auth.currentUser, ...profileData });
                return auth.currentUser;
            }
        } catch (error) {
            console.error("Error reloading user:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, deleteAccount, signInWithGoogle, reloadUser }}>
            {children}
        </AuthContext.Provider>
    );
};
