import { db } from '../firebaseConfig';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    where,
    doc,
    updateDoc,
    getDocs
} from 'firebase/firestore';

// --- Groups (Simplified for MVP) ---

export const getOrCreatePrivateChat = async (currentUid, targetUser) => {
    try {
        // 1. Check for existing chat (Basic check)
        const q = query(collection(db, 'groups'), where('members', 'array-contains', currentUid));
        const snapshot = await getDocs(q);

        const existing = snapshot.docs.find(doc => {
            const data = doc.data();
            return data.members.length === 2 && data.members.includes(targetUser.id) && data.type === 'private';
        });

        if (existing) return existing.id;

        // 2. Create new private chat
        // We use the other user's name as the group name for display simplicity in this MVP
        return await createGroup(targetUser.displayName || targetUser.username, [currentUid, targetUser.id], 'private');
    } catch (error) {
        console.error("Error getting private chat:", error);
        throw error;
    }
};

export const createGroup = async (name, memberIds, type = 'group') => {
    try {
        const groupRef = await addDoc(collection(db, 'groups'), {
            name,
            members: memberIds,
            createdAt: serverTimestamp(),
            lastMessage: null,
            type
        });
        return groupRef.id;
    } catch (error) {
        console.error("Error creating group:", error);
        throw error;
    }
};

export const subscribeToGroups = (userId, callback) => {
    // Query groups where 'members' array contains userId
    const q = query(
        collection(db, 'groups'),
        where('members', 'array-contains', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const groups = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(groups);
    });
};

// --- Messages ---

export const sendMessage = async (groupId, text, user, placeId = null) => {
    try {
        const messagesRef = collection(db, 'groups', groupId, 'messages');
        const newMessage = {
            text,
            senderId: user.uid,
            senderName: user.displayName || 'Anonymous',
            createdAt: serverTimestamp(),
            placeId // Optional: ID of the shared place
        };

        const docRef = await addDoc(messagesRef, newMessage);

        // Update last message on group for list preview
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
            lastMessage: {
                text: placeId ? 'Shared a place' : text,
                createdAt: serverTimestamp(),
                senderId: user.uid,
                senderName: user.displayName || 'Anonymous',
                senderRole: user.role || 'user' // Snapshot role for badges
            }
        });

        return docRef.id;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

export const subscribeToMessages = (groupId, callback) => {
    const q = query(
        collection(db, 'groups', groupId, 'messages'),
        orderBy('createdAt', 'asc') // Chronological for chat
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};
