import { db } from '../services/firebaseConfig';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Note: Execute this manually in development. 
// Requires an initialized Firebase connection.

const SEED_DATA = [
  {
    businessId: 'seed_b1',
    ownerId: 'placeholder_founder_id', // Would be replaced with a real business account ID
    name: 'The Rusty Bean',
    description: 'Cozy artisanal cafe perfect for remote work or a quiet date.',
    category: 'Cafe',
    moods: ['Work', 'Relax', 'Coffee'],
    priceRange: '$$',
    location: { latitude: 30.0444, longitude: 31.2357 },
    ratingAvg: 4.5,
    ratingCount: 120,
    images: ['https://picsum.photos/400/300?random=10'],
    openingHours: '07:00 AM - 10:00 PM',
    features: ['WiFi', 'Power Outlets', 'Quiet', 'Vegan Options'],
    menu: [],
  },
  {
    businessId: 'seed_b2',
    ownerId: 'placeholder_founder_id',
    name: 'Burger Joint X',
    description: 'Loud, vibrant, and serving the best smash burgers in town.',
    category: 'Restaurant',
    moods: ['Family', 'Loud', 'Popular'],
    priceRange: '$$$',
    location: { latitude: 30.0500, longitude: 31.2400 },
    ratingAvg: 4.8,
    ratingCount: 350,
    images: ['https://picsum.photos/400/300?random=11'],
    openingHours: '12:00 PM - 02:00 AM',
    features: ['Outdoor Seating', 'Live Music', 'Parking'],
    menu: [],
  },
  {
    businessId: 'seed_b3',
    ownerId: 'placeholder_founder_id',
    name: 'Sunset Rooftop Lounge',
    description: 'Elegant rooftop with panoramic city views, ideal for dates.',
    category: 'Hangout',
    moods: ['Date', 'Relax', 'Popular'],
    priceRange: '$$$$',
    location: { latitude: 30.0600, longitude: 31.2300 },
    ratingAvg: 4.9,
    ratingCount: 890,
    images: ['https://picsum.photos/400/300?random=12'],
    openingHours: '05:00 PM - 03:00 AM',
    features: ['Valet Parking', 'Reservations Required', 'Alcohol Served'],
    menu: [],
  }
];

export const seedBusinesses = async () => {
  try {
    const businessesCol = collection(db, 'businesses');
    
    for (const data of SEED_DATA) {
      const docRef = doc(businessesCol, data.businessId);
      
      // Transform location to proper Firestore GeoPoint requires the SDK
      // but for raw setDoc payload, we will just use the standard map structure 
      // which Firestore SDK interprets or we wrap with new GeoPoint() in a real node env.
      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp()
      });
      console.log(`Seeded: ${data.name}`);
    }
    
    console.log('Seeding Complete! 🎉');
  } catch (err) {
    console.error('Error seeding data:', err);
  }
};
