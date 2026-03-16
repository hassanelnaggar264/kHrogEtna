import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const VenueService = {
    /**
     * seedInitialData
     * Adds sample venues to Firestore if the collection is empty.
     */
    seedInitialData: async () => {
        try {
            const venuesRef = collection(db, 'venues');
            const snapshot = await getDocs(venuesRef);

            // Re-run check: Only seed if fewer than 5 venues exist
            if (snapshot.size >= 5) {
                console.log('Venues collection appears populated. Count:', snapshot.size);
                return;
            }

            console.log('Seeding Venues Data...');
            const sampleVenues = [
                {
                    name: 'Ovio',
                    governorate: 'Giza',
                    city: 'Sheikh Zayed',
                    vibe: 'foodie',
                    rating: 4.8,
                    image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=2071&auto=format&fit=crop',
                    verified: true,
                    description: 'Artisan European menu with a lovely outdoor terrace.',
                    price: '$$$'
                },
                {
                    name: 'Cake Cafe',
                    governorate: 'Cairo',
                    city: 'Zamalek',
                    vibe: 'chill',
                    rating: 4.5,
                    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1974&auto=format&fit=crop',
                    verified: true,
                    description: 'Cozy spot for fresh cakes and quiet coffee.',
                    price: '$$'
                },
                {
                    name: 'Crimson',
                    governorate: 'Cairo',
                    city: 'Zamalek',
                    vibe: 'party',
                    rating: 4.7,
                    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop',
                    verified: true,
                    description: 'Rooftop bar with a view of the Nile and great music.',
                    price: '$$$$'
                },
                {
                    name: 'Espresso Lab',
                    governorate: 'Cairo',
                    city: 'Maadi',
                    vibe: 'work',
                    rating: 4.6,
                    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop',
                    verified: false,
                    description: 'Perfect spot for remote work with fast wifi and strong coffee.',
                    price: '$$'
                },
                {
                    name: 'Andrea Mariouteya',
                    governorate: 'Giza',
                    city: '6th of October',
                    vibe: 'family',
                    rating: 4.4,
                    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
                    verified: true,
                    description: 'Classic family gathering spot with grilled food and outdoor seating.',
                    price: '$$$'
                }
            ];

            for (const venue of sampleVenues) {
                await addDoc(venuesRef, venue);
            }
            console.log('Sample venues seeded successfully!');
        } catch (error) {
            console.error('Error seeding venues:', error);
        }
    },

    /**
     * getVenues
     * Fetches venues based on filters (Governorate, City, Mood).
     */
    getVenues: async (filters = {}) => {
        try {
            const venuesRef = collection(db, 'venues');
            const constraints = [];

            if (filters.gov) {
                constraints.push(where('governorate', '==', filters.gov));
            }
            if (filters.city) {
                constraints.push(where('city', '==', filters.city));
            }
            if (filters.mood && filters.mood !== 'all') {
                constraints.push(where('vibe', '==', filters.mood));
            }

            const q = query(venuesRef, ...constraints);
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching venues:', error);
            throw error;
        }
    }
};
