const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Hardcoded config for script usage (Node.js doesn't parse ES6 export easily without type: module)
const firebaseConfig = {
    apiKey: 'AIzaSyAhXESlxFbkbzcWS9m54gcB1MMj9SWhLo4',
    authDomain: 'khrogetna.firebaseapp.com',
    projectId: 'khrogetna',
    storageBucket: 'khrogetna.firebasestorage.app',
    messagingSenderId: '969132303004',
    appId: '1:969132303004:web:694a32313674d671c48359'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const venues = [
    { "name": "Ovio - Maadi", "vibes": ["Cozy & Chill", "Family Outing"], "rating": 4.8, "priceRange": "$$$", "image": "https://images.unsplash.com/photo-1554118811-1e0d58224f24", "location": "Maadi" },
    { "name": "Sky Rim", "vibes": ["Loud & Fun", "Energetic"], "rating": 4.5, "priceRange": "$$$$", "image": "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7", "location": "Zamalek" },
    { "name": "Cake Cafe", "vibes": ["Focus", "Cozy & Chill"], "rating": 4.9, "priceRange": "$$", "image": "https://images.unsplash.com/photo-1559925393-8be0ec41b50d", "location": "Zayed" },
    { "name": "The Drive-In", "vibes": ["Family Outing", "Quick bite"], "rating": 4.3, "priceRange": "$$", "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", "location": "New Cairo" },
    { "name": "Crimson", "vibes": ["Date", "Luxurious"], "rating": 4.7, "priceRange": "$$$$", "image": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b", "location": "Zamalek" },
    { "name": "Espresso Lab", "vibes": ["Focus", "Quick bite"], "rating": 4.6, "priceRange": "$$", "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", "location": "Tagamoa" },
    { "name": "Gaby's", "vibes": ["Family Outing", "Cozy & Chill"], "rating": 4.4, "priceRange": "$$$", "image": "https://images.unsplash.com/photo-1552566626-52f8b828add9", "location": "City Stars" },
    { "name": "Sachi", "vibes": ["Date", "Luxurious", "Loud & Fun"], "rating": 4.9, "priceRange": "$$$$$", "image": "https://images.unsplash.com/photo-1559339352-11d035aa65de", "location": "Heliopolis" },
    { "name": "Beano's", "vibes": ["Focus", "Cozy & Chill"], "rating": 4.2, "priceRange": "$$", "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93", "location": "Maadi" },
    { "name": "Zooba", "vibes": ["Quick bite", "Family Outing"], "rating": 4.5, "priceRange": "$$", "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38", "location": "Zamalek" }
];

async function seed() {
    console.log('Starting seed...');
    const colParams = collection(db, 'places');

    for (const venue of venues) {
        try {
            // Note: We are using addDoc which auto-generates IDs. 
            // In a real app we might want to check if name exists to avoid duplicates, but for dummy data init this is fine.
            const docRef = await addDoc(colParams, {
                ...venue,
                // Adding normalized fields for client compatibility if needed
                city: venue.location, // Mapping location to city for our app logic
                images: [venue.image], // Mapping single image to array
                cuisine: ['International'], // Placeholder
                createdAt: new Date()
            });
            console.log(`Added venue: ${venue.name} with ID: ${docRef.id}`);
        } catch (e) {
            console.error(`Error adding ${venue.name}: `, e);
        }
    }
    console.log('Seeding complete.');
}

seed().then(() => process.exit(0)).catch(() => process.exit(1));
