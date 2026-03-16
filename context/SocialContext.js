/**
 * SocialContext.jsx
 * React Context for managing social features across the app
 * Provides current user data, reactive following state, and atomic actions
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import SocialService from '../services/SocialService';

const SocialContext = createContext(null);

export const useSocial = () => {
    const context = useContext(SocialContext);
    if (!context) {
        throw new Error('useSocial must be used within SocialProvider');
    }
    return context;
};

export const SocialProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    // Reactive Set of IDs that the current user is following
    const [followingIds, setFollowingIds] = useState(new Set());

    useEffect(() => {
        const auth = getAuth();

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Parallel fetch: User Profile + Following List
                    const [userProfile, followingData] = await Promise.all([
                        SocialService.getUserProfile(firebaseUser.uid),
                        // Fetch initial batch of following IDs (limit 1000 for scalability)
                        SocialService.getFollowing(firebaseUser.uid, 1000)
                    ]);

                    setCurrentUser(userProfile);

                    // Initialize following set
                    const ids = new Set(followingData.users.map(u => u.uid));
                    setFollowingIds(ids);

                } catch (error) {
                    console.error('Error fetching user social data:', error);
                    setCurrentUser(null);
                    setFollowingIds(new Set());
                }
            } else {
                setCurrentUser(null);
                setFollowingIds(new Set());
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    /**
     * Refresh current user data (useful after profile updates)
     */
    const refreshCurrentUser = async () => {
        if (!currentUser?.uid) return;

        try {
            const userProfile = await SocialService.getUserProfile(currentUser.uid);
            setCurrentUser(userProfile);
        } catch (error) {
            console.error('Error refreshing user profile:', error);
        }
    };

    /**
     * Check if current user is following a target user
     * SYNCHRONOUS check against reactive state
     */
    const isFollowing = (targetUserId) => {
        return followingIds.has(targetUserId);
    };

    /**
     * Follow a user with optimistic UI update
     */
    const followUser = async (targetUserId) => {
        if (!currentUser?.uid) return;

        // Optimistic Update
        setFollowingIds(prev => new Set(prev).add(targetUserId));

        // Update local user count optimistically
        setCurrentUser(prev => ({
            ...prev,
            followingCount: (prev.followingCount || 0) + 1
        }));

        try {
            await SocialService.followUser(currentUser.uid, targetUserId);
        } catch (error) {
            // Rollback on error
            console.error('Follow failed, rolling back:', error);
            setFollowingIds(prev => {
                const next = new Set(prev);
                next.delete(targetUserId);
                return next;
            });
            setCurrentUser(prev => ({
                ...prev,
                followingCount: Math.max(0, (prev.followingCount || 1) - 1)
            }));
            throw error;
        }
    };

    /**
     * Unfollow a user with optimistic UI update
     */
    const unfollowUser = async (targetUserId) => {
        if (!currentUser?.uid) return;

        // Optimistic Update
        setFollowingIds(prev => {
            const next = new Set(prev);
            next.delete(targetUserId);
            return next;
        });

        // Update local user count optimistically
        setCurrentUser(prev => ({
            ...prev,
            followingCount: Math.max(0, (prev.followingCount || 0) - 1)
        }));

        try {
            await SocialService.unfollowUser(currentUser.uid, targetUserId);
        } catch (error) {
            // Rollback on error
            console.error('Unfollow failed, rolling back:', error);
            setFollowingIds(prev => new Set(prev).add(targetUserId));
            setCurrentUser(prev => ({
                ...prev,
                followingCount: (prev.followingCount || 0) + 1
            }));
            throw error;
        }
    };

    const value = {
        currentUser,
        isLoading,
        followingIds, // Expose Set for direct/reactive access
        refreshCurrentUser,
        isFollowing,
        followUser,
        unfollowUser,
    };

    return (
        <SocialContext.Provider value={value}>
            {children}
        </SocialContext.Provider>
    );
};

export default SocialContext;
