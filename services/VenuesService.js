import { collection, getDocs, getDoc, setDoc, doc, updateDoc, addDoc, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const VenuesService = {
    getVenues: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'venues'));
            const venues = [];
            querySnapshot.forEach((doc) => {
                venues.push({ id: doc.id, ...doc.data() });
            });
            return venues;
        } catch (error) {
            console.error("Error getting venues: ", error);
            throw error;
        }
    },

    getVenueById: async (id) => {
        try {
            const docRef = doc(db, 'venues', id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error getting venue details: ", error);
            throw error;
        }
    },

    rateVenue: async (id, rating, currentRating, currentCount, userId) => {
        try {
            const venueRef = doc(db, 'venues', id);

            // 1. Add/Update the user's rating in subcollection
            const ratingRef = doc(db, 'venues', id, 'ratings', userId);
            await setDoc(ratingRef, {
                rating: rating,
                userId: userId,
                createdAt: Timestamp.now()
            });

            // 2. Fetch all ratings to calculate new average
            const ratingsSnapshot = await getDocs(collection(db, 'venues', id, 'ratings'));
            let totalRating = 0;
            let count = 0;

            ratingsSnapshot.forEach((doc) => {
                totalRating += doc.data().rating;
                count++;
            });

            const newAverage = count > 0 ? totalRating / count : 0;

            // 3. Update venue document
            await updateDoc(venueRef, {
                rating: parseFloat(newAverage.toFixed(1)),
                ratingCount: count
            });

            return { rating: newAverage, ratingCount: count };
        } catch (error) {
            console.error("Error rating venue: ", error);
            throw error;
        }
    },

    getUserRating: async (venueId, userId) => {
        try {
            const docRef = doc(db, 'venues', venueId, 'ratings', userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().rating;
            }
            return 0;
        } catch (error) {
            console.error("Error getting user rating: ", error);
            return 0;
        }
    },

    addComment: async (venueId, text, user) => {
        try {
            const commentsRef = collection(db, 'venues', venueId, 'comments');
            await addDoc(commentsRef, {
                text,
                userId: user?.uid,
                userName: user?.displayName || 'Anonymous',
                createdAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error adding comment: ", error);
            throw error;
        }
    },

    getComments: async (venueId) => {
        try {
            const commentsRef = collection(db, 'venues', venueId, 'comments');
            const q = query(commentsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const comments = [];
            querySnapshot.forEach((doc) => {
                comments.push({ id: doc.id, ...doc.data() });
            });
            return comments;
        } catch (error) {
            console.error("Error getting comments: ", error);
            throw error;
        }
    },

    addVenue: async (venueData) => {
        try {
            const docRef = await addDoc(collection(db, 'venues'), {
                ...venueData,
                rating: 0,
                ratingCount: 0,
                createdAt: Timestamp.now()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error adding venue: ", error);
            throw error;
        }
    },

    getVenuesByOwner: async (userId) => {
        try {
            const q = query(collection(db, 'venues'), where('businessId', '==', userId));
            const querySnapshot = await getDocs(q);
            const venues = [];
            querySnapshot.forEach((doc) => {
                venues.push({ id: doc.id, ...doc.data() });
            });
            return venues;
        } catch (error) {
            console.error("Error getting owner venues: ", error);
            throw error;
        }
    }
};
