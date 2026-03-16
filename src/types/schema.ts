import { GeoPoint, Timestamp } from 'firebase/firestore';

export type AccountType = 'personal' | 'business';

export interface User {
  userId: string;
  name: string;
  username: string;
  bio: string;
  avatar: string;
  accountType: AccountType;
  followersCount: number;
  followingCount: number;
  isFounder: boolean;
  founderBadge?: string;
  founderPicks?: string[]; // Array of businessIds
  createdAt: Timestamp;
}

export interface Business {
  businessId: string;
  ownerId: string; // References users.userId
  name: string;
  description: string;
  category: string;
  moods: string[];
  priceRange: string;
  location: GeoPoint;
  ratingAvg: number;
  ratingCount: number;
  images: string[];
  openingHours: string;
  features: string[]; // e.g. WiFi, Parking
  menu: string[]; // Coming soon
  createdAt: Timestamp;
}

export interface Rating {
  ratingId: string;
  userId: string; // References users.userId
  businessId: string; // References businesses.businessId
  rating: number;
  review: string;
  photos?: string[];
  createdAt: Timestamp;
}

export interface Follow {
  followId: string;
  followerId: string; // References users.userId
  followingId: string; // References users.userId
  createdAt: Timestamp;
}
