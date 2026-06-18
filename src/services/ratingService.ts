import { 
  runTransaction, 
  doc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  Timestamp, 
  setDoc 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebaseConfig';
import { Rating, ContentReport } from '../types/schema';
import { MOCK_PLACES } from '../data/mockPlaces';

// Session-level memory cache for ratings/reviews to ensure immediate, robust offline updates
const sessionReviewsCache = new Map<string, Rating[]>();

/**
 * Fetches all reviews for a specific business/place.
 * Merges Firestore docs, session edits, and falls back to mock reviews.
 */
export const getPlaceReviews = async (businessId: string): Promise<Rating[]> => {
  let dbReviews: Rating[] = [];
  
  try {
    const ratingsRef = collection(db, 'ratings');
    const q = query(ratingsRef, where('businessId', '==', businessId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    querySnapshot.forEach((docSnap) => {
      dbReviews.push(docSnap.data() as Rating);
    });
  } catch (err) {
    console.log(`Firestore getPlaceReviews failed for ${businessId}, falling back to local/session dataset:`, err);
  }

  // Fallback: If no db reviews, load from local MOCK_PLACES
  if (dbReviews.length === 0) {
    const enriched = MOCK_PLACES.find(p => p.businessId === businessId);
    if (enriched && enriched.reviews) {
      dbReviews = enriched.reviews.map((rev, idx) => ({
        ratingId: `mock_rev_${businessId}_${idx}`,
        userId: `mock_user_${idx}`,
        businessId: businessId,
        rating: rev.rating,
        review: rev.review,
        createdAt: Timestamp.fromDate(new Date(rev.date)),
        // Add a field for author name mapping in mock data
        authorName: rev.author
      } as any));
    }
  }

  // Merge with session edits (if any offline edits were done in current app run)
  const sessionEdits = sessionReviewsCache.get(businessId) || [];
  sessionEdits.forEach((sessionRev) => {
    const existingIdx = dbReviews.findIndex(r => r.ratingId === sessionRev.ratingId || r.userId === sessionRev.userId);
    if (existingIdx !== -1) {
      dbReviews[existingIdx] = sessionRev; // Update with session state
    } else {
      dbReviews.unshift(sessionRev); // Add new session review to top
    }
  });

  return dbReviews;
};

/**
 * Fetches the review written by a specific user for a specific place (if any exists).
 */
export const getUserPlaceReview = async (userId: string, businessId: string): Promise<Rating | null> => {
  // Check session cache first
  const sessionEdits = sessionReviewsCache.get(businessId) || [];
  const sessionUserReview = sessionEdits.find(r => r.userId === userId);
  if (sessionUserReview) {
    return sessionUserReview;
  }

  try {
    const ratingsRef = collection(db, 'ratings');
    const q = query(ratingsRef, where('businessId', '==', businessId), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Rating;
    }
  } catch (err) {
    console.log(`Firestore getUserPlaceReview failed for user ${userId} on place ${businessId}:`, err);
  }

  // Check mock reviews as fallback
  const mockReviews = await getPlaceReviews(businessId);
  const matchedMock = mockReviews.find(r => r.userId === userId);
  return matchedMock || null;
};

/**
 * Atomically saves (Creates or Updates) a place review and aggregates avgRating and ratingsCount.
 */
export const savePlaceReviewTransaction = async (params: {
  businessId: string;
  userId: string;
  ratingValue: number;
  reviewText: string;
  photoUris?: string[];
  existingRatingId?: string;
}): Promise<string> => {
  const businessRef = doc(db, 'businesses', params.businessId);
  const ratingsRef = collection(db, 'ratings');
  const ratingRef = params.existingRatingId 
    ? doc(db, 'ratings', params.existingRatingId) 
    : doc(ratingsRef);

  const newRatingId = ratingRef.id;

  // Build rating data
  const now = Timestamp.now();
  const ratingData: Rating = {
    ratingId: newRatingId,
    userId: params.userId,
    businessId: params.businessId,
    rating: params.ratingValue,
    review: params.reviewText,
    photos: params.photoUris || [],
    createdAt: now, // Will be updated to serverTimestamp inside transaction, but using now for immediate fallback
    updatedAt: now
  };

  // 1. Update session-level local cache immediately
  const sessionList = sessionReviewsCache.get(params.businessId) || [];
  const existingSessionIdx = sessionList.findIndex(r => r.ratingId === newRatingId || r.userId === params.userId);
  if (existingSessionIdx !== -1) {
    sessionList[existingSessionIdx] = ratingData;
  } else {
    sessionList.unshift(ratingData);
  }
  sessionReviewsCache.set(params.businessId, sessionList);

  // 2. Perform Firestore Transaction
  try {
    await runTransaction(db, async (transaction) => {
      const businessSnap = await transaction.get(businessRef);
      if (!businessSnap.exists()) {
        throw new Error("Business place does not exist!");
      }

      const currentAvg = businessSnap.data().ratingAvg || 0;
      const currentCount = businessSnap.data().ratingCount || 0;

      let newAvg = currentAvg;
      let newCount = currentCount;

      if (params.existingRatingId) {
        // Edit flow
        const oldRatingSnap = await transaction.get(ratingRef);
        if (!oldRatingSnap.exists()) {
          throw new Error("Original rating document not found!");
        }
        const oldRatingValue = oldRatingSnap.data().rating || 0;

        if (currentCount > 0) {
          newAvg = ((currentAvg * currentCount) - oldRatingValue + params.ratingValue) / currentCount;
        } else {
          newAvg = params.ratingValue;
          newCount = 1;
        }
      } else {
        // Create flow
        newCount = currentCount + 1;
        newAvg = ((currentAvg * currentCount) + params.ratingValue) / newCount;
      }

      // Write rating updates
      const finalRatingData = {
        ...ratingData,
        createdAt: params.existingRatingId ? undefined : serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Filter undefined values before transaction write
      const cleanRatingData = JSON.parse(JSON.stringify(finalRatingData));

      if (params.existingRatingId) {
        transaction.update(ratingRef, cleanRatingData);
      } else {
        transaction.set(ratingRef, cleanRatingData);
      }

      // Write business updates
      transaction.update(businessRef, {
        ratingAvg: Number(newAvg.toFixed(2)),
        ratingCount: newCount
      });
    });

    console.log(`Transaction successfully committed for review: ${newRatingId}`);
  } catch (err) {
    console.log("Firestore savePlaceReviewTransaction failed, saved locally in session:", err);
  }

  // 3. Update local Rate Limit history (best effort)
  await recordReviewTimestampLocal(params.userId);

  return newRatingId;
};

/**
 * Submits a content report (Spam, Harassment, Inappropriate, Other) for a review or post.
 */
export const submitContentReport = async (
  userId: string,
  targetType: 'review' | 'post',
  targetId: string,
  reason: string
): Promise<void> => {
  const reportRef = doc(collection(db, 'reports'));
  const reportData: ContentReport = {
    reportId: reportRef.id,
    userId,
    targetType,
    targetId,
    reason,
    createdAt: Timestamp.now()
  };

  try {
    await setDoc(reportRef, {
      ...reportData,
      createdAt: serverTimestamp()
    });
    console.log(`Content report submitted successfully for target ${targetId}`);
  } catch (err) {
    console.log("Firestore submitContentReport failed, logging locally:", err);
  }
};

/**
 * Enforces rate limit check: max 3 reviews in the last hour.
 * First checks Firestore, then falls back to local AsyncStorage timestamps.
 */
export const checkReviewRateLimit = async (userId: string): Promise<{ allowed: boolean; remaining: number }> => {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  const oneHourAgoMs = oneHourAgo.getTime();

  let reviewCount = 0;

  try {
    // We query user's reviews, filtering client-side to avoid needing composite indexes
    const ratingsRef = collection(db, 'ratings');
    const q = query(ratingsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt as Timestamp;
      if (createdAt && createdAt.toMillis() >= oneHourAgoMs) {
        reviewCount++;
      }
    });
  } catch (err) {
    console.log("Firestore rate limit check failed, querying local AsyncStorage history:", err);
    // Local fallback
    const localTimestamps = await getLocalReviewTimestamps(userId);
    const recentLocal = localTimestamps.filter(ts => ts >= oneHourAgoMs);
    reviewCount = recentLocal.length;
  }

  const allowed = reviewCount < 3;
  return {
    allowed,
    remaining: Math.max(0, 3 - reviewCount)
  };
};

// --- Helper Functions for AsyncStorage Rate Limiting ---

const getLocalReviewTimestamps = async (userId: string): Promise<number[]> => {
  try {
    const dataStr = await AsyncStorage.getItem(`@reviews_rate_limit_${userId}`);
    if (dataStr) {
      return JSON.parse(dataStr) as number[];
    }
  } catch (err) {
    console.error("Error reading review timestamps from AsyncStorage", err);
  }
  return [];
};

const recordReviewTimestampLocal = async (userId: string): Promise<void> => {
  try {
    const list = await getLocalReviewTimestamps(userId);
    list.push(Date.now());
    
    // Prune entries older than 24 hours to save storage
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const pruned = list.filter(ts => ts >= twentyFourHoursAgo);

    await AsyncStorage.setItem(`@reviews_rate_limit_${userId}`, JSON.stringify(pruned));
  } catch (err) {
    console.error("Error writing review timestamp to AsyncStorage", err);
  }
};
