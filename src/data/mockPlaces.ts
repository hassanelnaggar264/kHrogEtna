export interface MockPlace {
  businessId: string;
  ownerId: string;
  name: string;
  description: string;
  category: string;
  moods: string[];
  priceRange: string;
  location: { latitude: number; longitude: number };
  ratingAvg: number;
  ratingCount: number;
  images: string[];
  openingHours: string;
  features: string[]; // attributes (Wi-Fi, quiet, smoking, kids, etc.)
  menu: { name: string; price: string; description: string }[];
  reviews: { author: string; rating: number; review: string; date: string }[];
}

export const MOCK_PLACES: MockPlace[] = [
  {
    businessId: 'place_1',
    ownerId: 'owner_ovio',
    name: 'Ovio - Maadi',
    description: 'European-style bistro and bakery, famous for its pancakes, artisanal breads, and premium coffee. A cozy spot for families and remote work.',
    category: 'Cafe & Restaurant',
    moods: ['Cozy', 'Relax', 'Popular', 'Family'],
    priceRange: '$$$',
    location: { latitude: 29.9602, longitude: 31.2618 },
    ratingAvg: 4.8,
    ratingCount: 245,
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1559925393-8be0ec41b50d?w=600&auto=format&fit=crop&q=60'
    ],
    openingHours: '08:00 AM - 11:30 PM',
    features: ['WiFi', 'Quiet Area', 'Kids Friendly', 'Outdoor Seating', 'Parking'],
    menu: [
      { name: 'Ovio Classic Pancakes', price: 'EGP 180', description: 'Fluffy buttermilk pancakes served with fresh berries, maple syrup, and whipped butter.' },
      { name: 'Avocado Toast', price: 'EGP 210', description: 'Toasted sourdough with mashed avocado, poached eggs, feta cheese, and cherry tomatoes.' },
      { name: 'Spanish Latte', price: 'EGP 95', description: 'Rich espresso with condensed milk and steamed milk.' }
    ],
    reviews: [
      { author: 'Hassan Elnaggar', rating: 5, review: 'Absolutely love their pancakes! The vibe in Maadi branch is very cozy, perfect for my morning founder meetings.', date: '2026-06-15' },
      { author: 'Farida A.', rating: 4, review: 'Great food, but it can get very crowded during Friday brunch. WiFi is fast!', date: '2026-06-12' }
    ]
  },
  {
    businessId: 'place_2',
    ownerId: 'owner_skyrim',
    name: 'Sky Rim Lounge',
    description: 'Breathtaking rooftop lounge in Zamalek with a 360 view of the Nile. Known for its energetic vibes, luxurious dining, and live DJ music at night.',
    category: 'Nightlife & Lounge',
    moods: ['Date', 'Loud', 'Popular', 'Luxurious'],
    priceRange: '$$$$',
    location: { latitude: 30.0601, longitude: 31.2242 },
    ratingAvg: 4.5,
    ratingCount: 312,
    images: [
      'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=60'
    ],
    openingHours: '05:00 PM - 03:00 AM',
    features: ['Smoking Allowed', 'Valet Parking', 'Nile View', 'Live Music', 'Alcohol Served'],
    menu: [
      { name: 'Grilled Ribeye Steak', price: 'EGP 750', description: 'Prime ribeye steak served with truffle mashed potatoes and grilled asparagus.' },
      { name: 'Sky Rim Sunset Mocktail', price: 'EGP 150', description: 'A refreshing blend of passion fruit, fresh lime, mint, and blue curacao.' },
      { name: 'Sushi Combo (16 pcs)', price: 'EGP 420', description: 'A selection of premium maki rolls, nigiri, and sashimi.' }
    ],
    reviews: [
      { author: 'Youssef M.', rating: 5, review: 'Best Nile view in Cairo. The DJ was amazing and the atmosphere is perfect for a date night.', date: '2026-06-10' },
      { author: 'Lila K.', rating: 4, review: 'Beautiful view and drinks, but service was a bit slow because of the weekend rush. Make sure to book ahead.', date: '2026-06-08' }
    ]
  },
  {
    businessId: 'place_3',
    ownerId: 'owner_cakecafe',
    name: 'Cake Cafe - Zayed',
    description: 'A charming, quiet garden cafe hidden in Sheikh Zayed. Famous for homemade bakery, gourmet cakes, and a peaceful environment ideal for reading or working.',
    category: 'Cafe',
    moods: ['Work', 'Relax', 'Cozy'],
    priceRange: '$$',
    location: { latitude: 30.0194, longitude: 30.9733 },
    ratingAvg: 4.9,
    ratingCount: 188,
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=60'
    ],
    openingHours: '09:00 AM - 10:00 PM',
    features: ['WiFi', 'Quiet Area', 'Outdoor Seating', 'Pet Friendly'],
    menu: [
      { name: 'Red Velvet Cake Slice', price: 'EGP 110', description: 'Signature homemade red velvet cake with creamy vanilla frosting.' },
      { name: 'Caramel Macchiato', price: 'EGP 85', description: 'Double shot of espresso, steamed milk, and sweet vanilla and caramel syrup.' },
      { name: 'Turkey & Swiss Croissant', price: 'EGP 130', description: 'Freshly baked buttery croissant stuffed with premium smoked turkey and Swiss cheese.' }
    ],
    reviews: [
      { author: 'Nour S.', rating: 5, review: 'This garden is a hidden gem. Super quiet and the WiFi works perfectly for remote work sessions.', date: '2026-06-16' }
    ]
  },
  {
    businessId: 'place_4',
    ownerId: 'owner_crimson',
    name: 'Crimson Nile Lounge',
    description: 'High-end rooftop dining in Zamalek with majestic river views, serving exquisite Mediterranean cuisine and premium cocktails.',
    category: 'Restaurant & Lounge',
    moods: ['Date', 'Luxurious', 'Popular'],
    priceRange: '$$$$$',
    location: { latitude: 30.0592, longitude: 31.2229 },
    ratingAvg: 4.7,
    ratingCount: 512,
    images: [
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&auto=format&fit=crop&q=60'
    ],
    openingHours: '12:00 PM - 02:00 AM',
    features: ['Smoking Allowed', 'Valet Parking', 'Nile View', 'Luxurious Bar'],
    menu: [
      { name: 'Seafood Paella', price: 'EGP 680', description: 'Saffron rice cooked with fresh shrimp, calamari, mussels, and bell peppers.' },
      { name: 'Beef Tenderloin', price: 'EGP 820', description: 'Angus beef tenderloin served with pepper sauce and rosemary potatoes.' },
      { name: 'Crimson Rose Wine', price: 'EGP 280', description: 'A glass of premium local rose wine.' }
    ],
    reviews: [
      { author: 'Hassan Elnaggar', rating: 5, review: 'Outstanding food quality and unparalleled service. Easily one of the top date night locations in Cairo.', date: '2026-06-14' }
    ]
  },
  {
    businessId: 'place_5',
    ownerId: 'owner_espressolab',
    name: 'Espresso Lab - Zayed',
    description: 'Modern, minimalist coffee lab in Sheikh Zayed focusing on specialty single-origin coffee and espresso drinks. Highly energized and packed with students.',
    category: 'Cafe',
    moods: ['Work', 'Popular'],
    priceRange: '$$',
    location: { latitude: 30.0232, longitude: 30.9810 },
    ratingAvg: 4.6,
    ratingCount: 420,
    images: [
      'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&auto=format&fit=crop&q=60'
    ],
    openingHours: '07:30 AM - 12:00 AM',
    features: ['WiFi', 'Power Outlets', 'Charging Stations', 'Indoor Seating'],
    menu: [
      { name: 'V60 Drip Coffee', price: 'EGP 95', description: 'Single-origin specialty coffee brewed using the V60 method.' },
      { name: 'Iced Pistachio Latte', price: 'EGP 110', description: 'Espresso, milk, and sweet pistachio sauce served over ice.' },
      { name: 'Choco Chip Cookie', price: 'EGP 60', description: 'Gigantic, warm, gooey chocolate chip cookie.' }
    ],
    reviews: [
      { author: 'Sherif H.', rating: 4, review: 'Best place to focus and study. Every desk has a power outlet. It does get noisy in the afternoon though.', date: '2026-06-11' }
    ]
  },
  {
    businessId: 'place_6',
    ownerId: 'owner_zooba',
    name: 'Zooba - Heliopolis',
    description: 'Vibrant, colorful street food restaurant serving modernized local Egyptian classics. A must-visit place for visitors and families alike.',
    category: 'Restaurant',
    moods: ['Family', 'Popular', 'Relax'],
    priceRange: '$',
    location: { latitude: 30.0912, longitude: 31.3325 },
    ratingAvg: 4.5,
    ratingCount: 890,
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=60'
    ],
    openingHours: '08:00 AM - 01:00 AM',
    features: ['Kids Friendly', 'Casual Vibe', 'Street Parking', 'Outdoor Seating'],
    menu: [
      { name: 'Gourmet Taameya Sandwich', price: 'EGP 45', description: 'Crispy taameya in baladi bread with tahini, arugula, and pickled lemon.' },
      { name: 'Koshary Box', price: 'EGP 70', description: 'Traditional Egyptian koshary served with hot tomato sauce, crispy onions, and garlic vinegar.' },
      { name: 'Hibiscus Lemonade', price: 'EGP 50', description: 'Cold, sweet, and refreshing hibiscus tea mixed with fresh lemonade.' }
    ],
    reviews: [
      { author: 'Amr G.', rating: 5, review: 'Best koshary and taameya modernization. Vibe is so nostalgic and colorful!', date: '2026-06-05' }
    ]
  }
];
