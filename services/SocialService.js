/**
 * SocialService.js
 * Production-ready Social Follow System for kHrogEtna
 * Handles all follow/unfollow operations with atomic transactions
 * and negative counter guards
 */

import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    runTransaction,
    collection,
    query,
    where,
    getDocs,
    limit,
    orderBy,
    startAfter,
} from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Corrected path to root firebaseConfig

/**
 * Firestore Collections Structure:
 * 
 * users/{uid}
 *   - username: string
 *   - isFounder: boolean
 *   - followersCount: number
 *   - followingCount: number
 *   - profilePic: string (optional)
 *   - createdAt: timestamp
 * 
 * social_graph/{relationshipId}
 *   - followerId: uid (user who follows)
 *   - followingId: uid (user being followed)
 *   - createdAt: timestamp
 * 
 * Composite ID format: {followerId}_{followingId}
 */

class SocialService {
    constructor() {
        this.USERS_COLLECTION = 'users';
        this.SOCIAL_GRAPH_COLLECTION = 'social_graph';

        // Cache for preventing duplicate requests
        this.pendingOperations = new Map();
    }

    /**
     * Generate a consistent relationship ID
     */
    _getRelationshipId(followerId, followingId) {
        return `${followerId}_${followingId}`;
    }

    /**
     * Check if User A is following User B
     * O(1) lookup using composite key
     */
    async isFollowing(followerId, followingId) {
        try {
            const relationshipId = this._getRelationshipId(followerId, followingId);
            const relationshipRef = doc(db, this.SOCIAL_GRAPH_COLLECTION, relationshipId);
            const relationshipSnap = await getDoc(relationshipRef);

            return relationshipSnap.exists();
        } catch (error) {
            console.error('Error checking follow status:', error);
            throw error;
        }
    }

    /**
     * Check if two users follow each other (mutual follow)
     */
    async isMutualFollow(userId1, userId2) {
        try {
            const [follows1to2, follows2to1] = await Promise.all([
                this.isFollowing(userId1, userId2),
                this.isFollowing(userId2, userId1),
            ]);

            return follows1to2 && follows2to1;
        } catch (error) {
            console.error('Error checking mutual follow:', error);
            throw error;
        }
    }

    /**
     * Follow a user with atomic transaction and negative guard
     * Implements idempotency to prevent duplicate follows
     */
    async followUser(followerId, followingId) {
        // Prevent self-follow
        if (followerId === followingId) {
            throw new Error('Cannot follow yourself');
        }

        // Create operation key for deduplication
        const operationKey = `follow_${followerId}_${followingId}`;

        // Check if operation is already in progress
        if (this.pendingOperations.has(operationKey)) {
            console.log('Follow operation already in progress');
            return this.pendingOperations.get(operationKey);
        }

        // Create promise for this operation
        const operationPromise = this._executeFollow(followerId, followingId);
        this.pendingOperations.set(operationKey, operationPromise);

        try {
            const result = await operationPromise;
            return result;
        } finally {
            // Clean up pending operation
            this.pendingOperations.delete(operationKey);
        }
    }

    async _executeFollow(followerId, followingId) {
        try {
            const relationshipId = this._getRelationshipId(followerId, followingId);
            const relationshipRef = doc(db, this.SOCIAL_GRAPH_COLLECTION, relationshipId);
            const followerRef = doc(db, this.USERS_COLLECTION, followerId);
            const followingRef = doc(db, this.USERS_COLLECTION, followingId);

            // Run atomic transaction
            const result = await runTransaction(db, async (transaction) => {
                // READS: Perform all reads upfront to satisfy Firestore requirements
                const [relationshipSnap, followerSnap, followingSnap] = await Promise.all([
                    transaction.get(relationshipRef),
                    transaction.get(followerRef),
                    transaction.get(followingRef)
                ]);

                // Check preconditions
                if (relationshipSnap.exists()) {
                    // Already following - idempotent behavior
                    console.log('Already following this user');
                    return { success: true, alreadyFollowing: true };
                }

                if (!followerSnap.exists() || !followingSnap.exists()) {
                    throw new Error('One or both users do not exist');
                }

                const followerData = followerSnap.data();
                const followingData = followingSnap.data();

                // WRITES: All writes happen after reads
                // Create the follow relationship
                transaction.set(relationshipRef, {
                    followerId,
                    followingId,
                    createdAt: new Date(),
                });

                // Increment follower's following count
                transaction.update(followerRef, {
                    followingCount: (followerData.followingCount || 0) + 1,
                });

                // Increment following's followers count
                transaction.update(followingRef, {
                    followersCount: (followingData.followersCount || 0) + 1,
                });

                return { success: true, alreadyFollowing: false };
            });

            console.log(`✅ Follow successful: ${followerId} -> ${followingId}`);
            return result;
        } catch (error) {
            console.error('Error following user:', error);
            throw error;
        }
    }

    /**
     * Unfollow a user with atomic transaction and negative guard
     */
    async unfollowUser(followerId, followingId) {
        // Prevent self-unfollow
        if (followerId === followingId) {
            throw new Error('Cannot unfollow yourself');
        }

        // Create operation key for deduplication
        const operationKey = `unfollow_${followerId}_${followingId}`;

        // Check if operation is already in progress
        if (this.pendingOperations.has(operationKey)) {
            console.log('Unfollow operation already in progress');
            return this.pendingOperations.get(operationKey);
        }

        // Create promise for this operation
        const operationPromise = this._executeUnfollow(followerId, followingId);
        this.pendingOperations.set(operationKey, operationPromise);

        try {
            const result = await operationPromise;
            return result;
        } finally {
            // Clean up pending operation
            this.pendingOperations.delete(operationKey);
        }
    }

    async _executeUnfollow(followerId, followingId) {
        try {
            const relationshipId = this._getRelationshipId(followerId, followingId);
            const relationshipRef = doc(db, this.SOCIAL_GRAPH_COLLECTION, relationshipId);
            const followerRef = doc(db, this.USERS_COLLECTION, followerId);
            const followingRef = doc(db, this.USERS_COLLECTION, followingId);

            // Run atomic transaction
            const result = await runTransaction(db, async (transaction) => {
                // READS: Perform all reads upfront
                const [relationshipSnap, followerSnap, followingSnap] = await Promise.all([
                    transaction.get(relationshipRef),
                    transaction.get(followerRef),
                    transaction.get(followingRef)
                ]);

                // Check preconditions
                if (!relationshipSnap.exists()) {
                    // Not following - idempotent behavior
                    console.log('Not following this user');
                    return { success: true, notFollowing: true };
                }

                if (!followerSnap.exists() || !followingSnap.exists()) {
                    throw new Error('One or both users do not exist');
                }

                const followerData = followerSnap.data();
                const followingData = followingSnap.data();

                // THE NEGATIVE GUARD: Ensure counters never go below zero
                const newFollowingCount = Math.max(0, (followerData.followingCount || 0) - 1);
                const newFollowersCount = Math.max(0, (followingData.followersCount || 0) - 1);

                // WRITES: All writes happen after reads
                // Delete the follow relationship
                transaction.delete(relationshipRef);

                // Decrement follower's following count (with guard)
                transaction.update(followerRef, {
                    followingCount: newFollowingCount,
                });

                // Decrement following's followers count (with guard)
                transaction.update(followingRef, {
                    followersCount: newFollowersCount,
                });

                return { success: true, notFollowing: false };
            });

            console.log(`✅ Unfollow successful: ${followerId} -/-> ${followingId}`);
            return result;
        } catch (error) {
            console.error('Error unfollowing user:', error);
            throw error;
        }
    }

    /**
     * Get list of users that the current user is following
     * Used for the "Select Contact" screen
     */
    async getFollowing(userId, limitCount = 50, lastDoc = null) {
        try {
            let q = query(
                collection(db, this.SOCIAL_GRAPH_COLLECTION),
                where('followerId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const querySnapshot = await getDocs(q);
            const following = [];
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

            // Get the full user data for each followed user
            const followingIds = querySnapshot.docs.map(doc => doc.data().followingId);

            if (followingIds.length > 0) {
                const userPromises = followingIds.map(id =>
                    getDoc(doc(db, this.USERS_COLLECTION, id))
                );

                const userSnaps = await Promise.all(userPromises);

                userSnaps.forEach(userSnap => {
                    if (userSnap.exists()) {
                        following.push({
                            uid: userSnap.id,
                            ...userSnap.data(),
                        });
                    }
                });
            }

            return {
                users: following,
                lastDoc: lastVisible,
                hasMore: querySnapshot.docs.length === limitCount,
            };
        } catch (error) {
            console.error('Error getting following list:', error);
            throw error;
        }
    }

    /**
     * Get list of users following the current user
     */
    async getFollowers(userId, limitCount = 50, lastDoc = null) {
        try {
            let q = query(
                collection(db, this.SOCIAL_GRAPH_COLLECTION),
                where('followingId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const querySnapshot = await getDocs(q);
            const followers = [];
            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

            // Get the full user data for each follower
            const followerIds = querySnapshot.docs.map(doc => doc.data().followerId);

            if (followerIds.length > 0) {
                const userPromises = followerIds.map(id =>
                    getDoc(doc(db, this.USERS_COLLECTION, id))
                );

                const userSnaps = await Promise.all(userPromises);

                userSnaps.forEach(userSnap => {
                    if (userSnap.exists()) {
                        followers.push({
                            uid: userSnap.id,
                            ...userSnap.data(),
                        });
                    }
                });
            }

            return {
                users: followers,
                lastDoc: lastVisible,
                hasMore: querySnapshot.docs.length === limitCount,
            };
        } catch (error) {
            console.error('Error getting followers list:', error);
            throw error;
        }
    }

    /**
     * Get user profile with follow statistics
     */
    async getUserProfile(userId) {
        try {
            const userRef = doc(db, this.USERS_COLLECTION, userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                throw new Error('User not found');
            }

            return {
                uid: userSnap.id,
                ...userSnap.data(),
            };
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    /**
     * Get follow relationship status between current user and target user
     * Returns: { isFollowing, isFollowedBy, isMutual }
     */
    async getRelationshipStatus(currentUserId, targetUserId) {
        try {
            if (currentUserId === targetUserId) {
                return { isSelf: true, isFollowing: false, isFollowedBy: false, isMutual: false };
            }

            const [isFollowing, isFollowedBy] = await Promise.all([
                this.isFollowing(currentUserId, targetUserId),
                this.isFollowing(targetUserId, currentUserId),
            ]);

            return {
                isSelf: false,
                isFollowing,
                isFollowedBy,
                isMutual: isFollowing && isFollowedBy,
            };
        } catch (error) {
            console.error('Error getting relationship status:', error);
            throw error;
        }
    }

    /**
     * Batch check follow status for multiple users
     * Useful for displaying follow buttons in search results or user lists
     */
    async batchCheckFollowing(currentUserId, targetUserIds) {
        try {
            const checks = targetUserIds.map(targetId =>
                this.isFollowing(currentUserId, targetId)
            );

            const results = await Promise.all(checks);

            const statusMap = {};
            targetUserIds.forEach((targetId, index) => {
                statusMap[targetId] = results[index];
            });

            return statusMap;
        } catch (error) {
            console.error('Error batch checking follow status:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new SocialService();
