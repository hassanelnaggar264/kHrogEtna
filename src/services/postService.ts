import { collection, getDocs, query, where, orderBy, setDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { PlacePost } from '../types/schema';

// Session-level memory cache for posts to ensure immediate offline availability
const sessionPostsCache = new Map<string, PlacePost[]>();

// Predefined high-quality Mixkit mock videos for primary places to make the app feel premium and alive
export const MOCK_POSTS: PlacePost[] = [
  {
    postId: 'mock_post_p1_1',
    placeId: 'place_1', // Ovio Maadi
    authorBusinessId: 'owner_ovio',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-maker-making-coffee-in-a-cafe-34320-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400',
    caption: 'Our signature morning blend roasted to perfection! ☕✨ #ovio #morningcoffee',
    createdAt: Timestamp.fromDate(new Date('2026-06-16T09:00:00Z'))
  },
  {
    postId: 'mock_post_p1_2',
    placeId: 'place_1', // Ovio Maadi
    authorBusinessId: 'owner_ovio',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-hot-coffee-into-a-cup-34321-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    caption: 'Pouring fresh energy into your day. Tap to see our breakfast menu! 🥞🍳',
    createdAt: Timestamp.fromDate(new Date('2026-06-17T08:30:00Z'))
  },
  {
    postId: 'mock_post_p2_1',
    placeId: 'place_2', // Sky Rim Lounge
    authorBusinessId: 'owner_skyrim',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waiter-pours-champagne-into-a-glass-34348-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400',
    caption: 'Sunset vibes and weekend pour-overs. Ready for a beautiful Nile view tonight? 🥂🌃 #skyrim',
    createdAt: Timestamp.fromDate(new Date('2026-06-15T18:00:00Z'))
  },
  {
    postId: 'mock_post_p3_1',
    placeId: 'place_3', // Cake Cafe Zayed
    authorBusinessId: 'owner_cakecafe',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-serving-food-to-a-table-in-a-restaurant-34346-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=400',
    caption: 'Freshly baked croissants served warm in our quiet garden! 🥐🌿 Perfect for your remote work sessions.',
    createdAt: Timestamp.fromDate(new Date('2026-06-14T10:00:00Z'))
  },
  {
    postId: 'mock_post_p6_1',
    placeId: 'place_6', // Zooba Heliopolis
    authorBusinessId: 'owner_zooba',
    mediaType: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-people-eating-together-at-a-restaurant-table-34349-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    caption: 'Traditional Egyptian street food modernized. Bring your family and share the joy! 🇪🇬🥙 #zooba',
    createdAt: Timestamp.fromDate(new Date('2026-06-16T13:00:00Z'))
  }
];

/**
 * Fetches all reels/posts linked to a specific placeId.
 */
export const getPlacePosts = async (placeId: string): Promise<PlacePost[]> => {
  let dbPosts: PlacePost[] = [];

  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('placeId', '==', placeId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
      dbPosts.push(docSnap.data() as PlacePost);
    });
  } catch (err) {
    console.log(`Firestore getPlacePosts failed for ${placeId}, falling back to local fallback:`, err);
  }

  // Fallback to mock posts if empty
  if (dbPosts.length === 0) {
    dbPosts = MOCK_POSTS.filter(p => p.placeId === placeId);
  }

  // Merge with session cache
  const sessionEdits = sessionPostsCache.get(placeId) || [];
  sessionEdits.forEach((sessPost) => {
    const existingIdx = dbPosts.findIndex(p => p.postId === sessPost.postId);
    if (existingIdx !== -1) {
      dbPosts[existingIdx] = sessPost;
    } else {
      dbPosts.unshift(sessPost); // Prepend new upload
    }
  });

  return dbPosts;
};

/**
 * Fetches all reels/posts from all places for the global feed.
 */
export const getAllPosts = async (): Promise<PlacePost[]> => {
  let dbPosts: PlacePost[] = [];

  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
      dbPosts.push(docSnap.data() as PlacePost);
    });
  } catch (err) {
    console.log("Firestore getAllPosts failed, falling back to local mock data:", err);
  }

  // Fallback: merge mock posts
  if (dbPosts.length === 0) {
    dbPosts = [...MOCK_POSTS];
  }

  // Merge session uploads
  sessionPostsCache.forEach((sessList) => {
    sessList.forEach((sessPost) => {
      if (!dbPosts.some(p => p.postId === sessPost.postId)) {
        dbPosts.unshift(sessPost);
      }
    });
  });

  // Sort by createdAt desc
  dbPosts.sort((a, b) => {
    const tA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
    const tB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
    return tB - tA;
  });

  return dbPosts;
};

/**
 * Creates and registers a new post/reel document.
 */
export const createPlacePost = async (params: {
  placeId: string;
  authorBusinessId: string;
  mediaType: 'video' | 'image';
  mediaUrl: string;
  caption?: string;
}): Promise<string> => {
  const postsRef = collection(db, 'posts');
  const postDocRef = doc(postsRef);
  const newPostId = postDocRef.id;

  const now = Timestamp.now();
  const postData: PlacePost = {
    postId: newPostId,
    placeId: params.placeId,
    authorBusinessId: params.authorBusinessId,
    mediaType: params.mediaType,
    mediaUrl: params.mediaUrl,
    thumbnailUrl: params.mediaType === 'video' ? 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' : params.mediaUrl, // Default cover placeholder
    caption: params.caption || '',
    createdAt: now
  };

  // 1. Save to session cache immediately
  const sessionList = sessionPostsCache.get(params.placeId) || [];
  sessionList.unshift(postData);
  sessionPostsCache.set(params.placeId, sessionList);

  // 2. Save to Firestore
  try {
    await setDoc(postDocRef, {
      ...postData,
      createdAt: serverTimestamp()
    });
    console.log(`Reel post created successfully in Firestore: ${newPostId}`);
  } catch (err) {
    console.log(`Firestore createPlacePost failed for ${newPostId}, saved in memory:`, err);
  }

  return newPostId;
};
