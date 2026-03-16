import { runTransaction, doc, collection, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Follow } from '../types/schema';

// Creates a deterministic ID for a follow relationship
const getFollowId = (followerId: string, followingId: string) => `${followerId}_${followingId}`;

export const executeFollow = async (followerId: string, followingId: string) => {
  if (followerId === followingId) throw new Error("Users cannot follow themselves");

  const followId = getFollowId(followerId, followingId);
  const followRef = doc(db, 'follows', followId);
  const followerRef = doc(db, 'users', followerId);
  const followingRef = doc(db, 'users', followingId);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Mandatory Reads first
      const followerDoc = await transaction.get(followerRef);
      const followingDoc = await transaction.get(followingRef);
      const followDoc = await transaction.get(followRef);

      if (!followerDoc.exists() || !followingDoc.exists()) {
        throw new Error("One or both users do not exist");
      }

      // Business Logic enforcement
      if (followerDoc.data().accountType === 'business') {
         throw new Error("Business accounts cannot follow users");
      }

      if (followDoc.exists()) {
        throw new Error("Already following this user");
      }

      // 2. Calculations
      const newFollowerCount = (followingDoc.data().followersCount || 0) + 1;
      const newFollowingCount = (followerDoc.data().followingCount || 0) + 1;

      // 3. Writes
      const followData: Follow = {
        followId,
        followerId,
        followingId,
        createdAt: serverTimestamp() as any
      };

      transaction.set(followRef, followData);
      
      transaction.update(followingRef, {
        followersCount: newFollowerCount
      });

      transaction.update(followerRef, {
        followingCount: newFollowingCount
      });
    });
    return true;
  } catch (err) {
    console.error("Follow Transaction Failed:", err);
    throw err;
  }
};

export const executeUnfollow = async (followerId: string, followingId: string) => {
  const followId = getFollowId(followerId, followingId);
  const followRef = doc(db, 'follows', followId);
  const followerRef = doc(db, 'users', followerId);
  const followingRef = doc(db, 'users', followingId);

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Mandatory Reads
      const followerDoc = await transaction.get(followerRef);
      const followingDoc = await transaction.get(followingRef);
      const followDoc = await transaction.get(followRef);

      if (!followDoc.exists()) {
        throw new Error("Not currently following this user");
      }

      // 2. Calculations (ensure we don't drop below 0)
      const currentFollowers = followingDoc.data()?.followersCount || 0;
      const currentFollowing = followerDoc.data()?.followingCount || 0;
      
      const newFollowerCount = Math.max(0, currentFollowers - 1);
      const newFollowingCount = Math.max(0, currentFollowing - 1);

      // 3. Writes
      transaction.delete(followRef);

      transaction.update(followingRef, {
        followersCount: newFollowerCount
      });

      transaction.update(followerRef, {
        followingCount: newFollowingCount
      });
    });
    return true;
  } catch (err) {
    console.error("Unfollow Transaction Failed:", err);
    throw err;
  }
};
