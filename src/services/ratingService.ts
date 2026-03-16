import { runTransaction, doc, collection, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Rating } from '../types/schema';

type SubmitRatingParams = {
  businessId: string;
  userId: string;
  ratingValue: number;
  reviewText: string;
  photoUris?: string[];
};

export const submitRatingTransaction = async (params: SubmitRatingParams) => {
  const businessRef = doc(db, 'businesses', params.businessId);
  // Get an auto-generated ID for the new rating document
  const newRatingRef = doc(collection(db, 'ratings')); 

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Read the business document First (MANDATORY in transactions before writes)
      const businessDoc = await transaction.get(businessRef);
      if (!businessDoc.exists()) {
        throw new Error("Business does not exist!");
      }

      // 2. Calculate new averages
      const currentAvg = businessDoc.data().ratingAvg || 0;
      const currentCount = businessDoc.data().ratingCount || 0;

      const newCount = currentCount + 1;
      const newAvg = ((currentAvg * currentCount) + params.ratingValue) / newCount;

      // 3. Perform Writes
      // Create the Rating document
      const ratingData: Rating = {
        ratingId: newRatingRef.id,
        userId: params.userId,
        businessId: params.businessId,
        rating: params.ratingValue,
        review: params.reviewText,
        photos: params.photoUris || [],
        createdAt: serverTimestamp() as any
      };
      
      transaction.set(newRatingRef, ratingData);

      // Update the Business document counters
      transaction.update(businessRef, {
        ratingAvg: newAvg,
        ratingCount: newCount
      });
    });
    
    return true;
  } catch (error) {
    console.error("Transaction failed: ", error);
    throw error;
  }
};
