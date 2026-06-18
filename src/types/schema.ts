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
  updatedAt?: Timestamp;
}

export interface ContentReport {
  reportId: string;
  userId: string; // Reporter
  targetType: 'review' | 'post';
  targetId: string; // ID of the review/post
  reason: string; // Spam, Harassment, Inappropriate, Other
  createdAt: Timestamp;
}

export interface Follow {
  followId: string;
  followerId: string; // References users.userId
  followingId: string; // References users.userId
  createdAt: Timestamp;
}

export interface MenuItem {
  itemId: string;
  name: string;
  nameEn?: string;
  price: number;
  currency: string; // "EGP"
  description?: string;
  tags?: string[]; // e.g. ["spicy", "veg", "vegan"]
  photo?: string;
}

export interface MenuSection {
  sectionId: string;
  title: string;
  items: MenuItem[];
}

export interface PlaceMenu {
  businessId: string;
  sections: MenuSection[];
  menuPhotos?: string[];
}

export interface PlacePost {
  postId: string;
  placeId: string;             // ربط إجباري بالمكان
  authorBusinessId: string;    // معرف الحساب التجاري الناشر
  mediaType: 'video' | 'image';
  mediaUrl: string;            // رابط الوسيط على Firebase Storage
  thumbnailUrl?: string;       // صورة مصغرة للفيديو
  caption?: string;            // شرح أو نص المنشور
  createdAt: Timestamp;
}
