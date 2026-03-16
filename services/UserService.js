import { db } from '../firebaseConfig';
import { doc, updateDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

export const UserService = {
    /**
     * Updates the user's preferences in Firestore.
     * @param {string} uid - The user's ID.
     * @param {Array<string>} interests - Array of selected interests.
     */
    updateUserPreferences: async (uid, interests) => {
        try {
            const userRef = doc(db, 'users', uid);
            // Using setDoc with merge: true ensures we create the doc if it doesn't exist
            // or update it if it does, without overwriting other fields.
            await setDoc(userRef, {
                preferences: interests,
                updatedAt: new Date()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error updating preferences: ", error);
            return false;
        }
    },

    /**
     * Deletes the user's data from Firestore.
     * @param {string} uid - The user's ID.
     */
    deleteUserData: async (uid) => {
        try {
            const userRef = doc(db, 'users', uid);
            await deleteDoc(userRef);
            return true;
        } catch (error) {
            console.error("Error deleting user data: ", error);
            return false;
        }
    },

    /**
     * Retrieves the user's preferences from Firestore.
     * @param {string} uid - The user's ID.
     * @returns {Promise<Array<string>>} - Array of interest IDs.
     */
    getUserPreferences: async (uid) => {
        try {
            // Import locally to avoid circular deps if needed, though top-level is fine usually.
            // But preserving previous logic:
            const { getDoc } = require('firebase/firestore');
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return userSnap.data().preferences || [];
            }
            return [];
        } catch (error) {
            console.error("Error fetching preferences: ", error);
            return [];
        }
    },

    /**
     * Updates the user's profile data in Firestore.
     * @param {string} uid - The user's ID.
     * @param {Object} data - The profile data (fullName, age, gender, phone).
     */
    updateUserProfile: async (uid, data) => {
        try {
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, {
                ...data,
                updatedAt: new Date()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error updating profile: ", error);
            // Return false instead of throwing to prevent app crash
            return false;
        }
    },

    /**
     * Retrieves the user's full profile data from Firestore.
     * @param {string} uid - The user's ID.
     * @returns {Promise<Object>} - The user data.
     */
    getUserProfile: async (uid) => {
        try {
            const { getDoc } = require('firebase/firestore');
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                return userSnap.data();
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    },

    /**
     * Follows a user.
     * @param {string} currentUid - ID of the user performing the action.
     * @param {string} targetUid - ID of the user to follow.
     */
    followUser: async (currentUid, targetUid) => {
        const SocialService = require('./SocialService').default;
        try {
            const result = await SocialService.followUser(currentUid, targetUid);
            return result.success;
        } catch (error) {
            console.error("Error following user via SocialService:", error);
            return false;
        }
    },

    /**
     * Unfollows a user.
     * @param {string} currentUid - ID of the user performing the action.
     * @param {string} targetUid - ID of the user to unfollow.
     */
    unfollowUser: async (currentUid, targetUid) => {
        const SocialService = require('./SocialService').default;
        try {
            const result = await SocialService.unfollowUser(currentUid, targetUid);
            return result.success;
        } catch (error) {
            console.error("Error unfollowing user via SocialService:", error);
            return false;
        }
    },

    /**
     * Checks if the current user is following the target user.
     * @param {string} currentUid 
     * @param {string} targetUid 
     * @returns {Promise<boolean>}
     */
    isFollowing: async (currentUid, targetUid) => {
        const SocialService = require('./SocialService').default;
        try {
            return await SocialService.isFollowing(currentUid, targetUid);
        } catch (error) {
            console.error("Error checking isFollowing via SocialService:", error);
            return false;
        }
    },

    /**
     * Retrieves the users that the current user is following.
     * Use this for the Contacts list.
     * @param {string} uid 
     * @returns {Promise<Array>} List of user objects
     */
    getFollowedUsers: async (uid) => {
        const SocialService = require('./SocialService').default;
        try {
            const result = await SocialService.getFollowing(uid, 100); // Default limit
            return result.users;
        } catch (error) {
            console.error("Error getting followed users via SocialService:", error);
            return [];
        }
    },

    /**
     * Checks if a username is available.
     * @param {string} username - The username to check.
     * @returns {Promise<boolean>} - True if available, false if taken.
     */
    checkUsernameAvailability: async (username) => {
        try {
            const { collection, query, where, getDocs } = require('firebase/firestore');
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            return querySnapshot.empty;
        } catch (error) {
            console.error("Error checking username:", error);
            // On error, return false (unavailable) to be safe
            return false;
        }
    },

    /**
     * Searches for users by full name or username.
     * @param {string} searchTerm - The search query.
     * @returns {Promise<Array>} - List of matching users.
     */
    searchUsers: async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 1) return [];
        try {
            const { collection, query, where, getDocs, limit, or } = require('firebase/firestore');
            const usersRef = collection(db, 'users');
            const termLower = searchTerm.toLowerCase();
            const termCap = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1);

            // Strategy: Perform parallel queries for best coverage without external search engine
            // 1. Match by username (stored as lowercase)
            const qUsername = query(
                usersRef,
                where('username', '>=', termLower),
                where('username', '<=', termLower + '\uf8ff'),
                limit(10)
            );

            // 2. Match by fullName (Try Capitalized first as names usually are)
            const qName = query(
                usersRef,
                where('fullName', '>=', termCap),
                where('fullName', '<=', termCap + '\uf8ff'),
                limit(10)
            );

            // Note: If you want strictly case-insensitive fullName search, you must store 'fullName_lower' in Firestore.

            const [snapUsername, snapName] = await Promise.all([
                getDocs(qUsername),
                getDocs(qName)
            ]);

            const usersMap = new Map();

            snapUsername.forEach((doc) => {
                usersMap.set(doc.id, { id: doc.id, ...doc.data() });
            });

            snapName.forEach((doc) => {
                usersMap.set(doc.id, { id: doc.id, ...doc.data() });
            });

            return Array.from(usersMap.values());
        } catch (error) {
            console.error("Error searching users:", error);
            return [];
        }
    },

    /**
     * Retrieves multiple user profiles by their IDs.
     * @param {Array<string>} uids - Array of user IDs.
     * @returns {Promise<Array>} - List of user data objects.
     */
    getUsersByIds: async (uids) => {
        if (!uids || uids.length === 0) return [];
        try {
            const { collection, query, where, getDocs, documentId } = require('firebase/firestore');
            const usersRef = collection(db, 'users');
            // Firestore 'in' query is limited to 10 items.
            const chunks = [];
            for (let i = 0; i < uids.length; i += 10) {
                chunks.push(uids.slice(i, i + 10));
            }

            const results = [];
            for (const chunk of chunks) {
                const q = query(usersRef, where(documentId(), 'in', chunk));
                const snapshot = await getDocs(q);
                snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
            }
            return results;
        } catch (error) {
            console.error("Error fetching users by IDs:", error);
            return [];
        }
    }
};
