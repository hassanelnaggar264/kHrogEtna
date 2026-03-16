/**
 * FollowButton.jsx
 * Instagram-style Follow Button Component with State Machine
 * Supports: Follow, Following, Follow Back, Loading, Disabled states
 * Integrates with SocialContext for global state synchronization
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSocial } from '../context/SocialContext';

/**
 * Button States:
 * - FOLLOW: User is not following the target
 * - FOLLOWING: User is currently following the target
 * - FOLLOW_BACK: Target is following the user, but user isn't following back
 * - LOADING: Operation in progress
 * - DISABLED: User's own profile or invalid state
 */

const FollowButton = ({
    targetUserId,
    targetUsername,
    isFollowedBy = false, // Passed from parent (e.g. detailed profile check)
    onFollowChange, // Optional callback
    disabled = false,
    style,
    size = 'medium', // 'small', 'medium', 'large'
}) => {
    // Global State from Context
    const {
        currentUser,
        isFollowing,
        followUser,
        unfollowUser
    } = useSocial();

    // Local loading/error state
    const [isLoading, setIsLoading] = useState(false);

    // Derived states
    const isSelf = currentUser?.uid === targetUserId;
    const isFollowingTarget = isFollowing(targetUserId);

    /**
     * Determine current button state
     */
    const getButtonState = () => {
        if (isSelf || disabled) return 'DISABLED';
        if (isLoading) return 'LOADING';
        if (isFollowingTarget) return 'FOLLOWING';
        if (isFollowedBy && !isFollowingTarget) return 'FOLLOW_BACK';
        return 'FOLLOW';
    };

    const buttonState = getButtonState();

    /**
     * Handle follow/unfollow action
     */
    const handlePress = async () => {
        if (isSelf || disabled || isLoading) return;

        setIsLoading(true);
        try {
            if (isFollowingTarget) {
                // Unfollow
                await unfollowUser(targetUserId);
                if (onFollowChange) onFollowChange({ targetUserId, isFollowing: false, action: 'unfollow' });
            } else {
                // Follow
                await followUser(targetUserId);
                if (onFollowChange) onFollowChange({ targetUserId, isFollowing: true, action: 'follow' });
            }
        } catch (error) {
            console.error('Action failed:', error);
            // Error handling is managed by context (rollback), but we could show toast here
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Get button text based on state
     */
    const getButtonText = () => {
        switch (buttonState) {
            case 'FOLLOWING':
                return 'Following';
            case 'FOLLOW_BACK':
                return 'Follow Back';
            case 'LOADING':
                return '';
            case 'DISABLED':
                return 'Edit Profile'; // For user's own profile
            case 'FOLLOW':
            default:
                return 'Follow';
        }
    };

    /**
     * Get button styles based on state
     */
    const getButtonStyle = () => {
        const baseStyle = [styles.button, styles[`button_${size}`]];

        switch (buttonState) {
            case 'FOLLOWING':
                return [...baseStyle, styles.buttonFollowing];
            case 'FOLLOW_BACK':
                return [...baseStyle, styles.buttonFollowBack];
            case 'DISABLED':
                return [...baseStyle, styles.buttonDisabled];
            case 'LOADING':
                return [...baseStyle, styles.buttonLoading];
            case 'FOLLOW':
            default:
                return [...baseStyle, styles.buttonFollow];
        }
    };

    const getTextStyle = () => {
        const baseStyle = [styles.buttonText, styles[`buttonText_${size}`]];

        switch (buttonState) {
            case 'FOLLOWING':
                return [...baseStyle, styles.textFollowing];
            case 'FOLLOW_BACK':
                return [...baseStyle, styles.textFollowBack];
            case 'DISABLED':
                return [...baseStyle, styles.textDisabled];
            case 'FOLLOW':
            default:
                return [...baseStyle, styles.textFollow];
        }
    };

    return (
        <TouchableOpacity
            style={[...getButtonStyle(), style]}
            onPress={handlePress}
            disabled={isSelf || disabled || isLoading}
            activeOpacity={0.7}
        >
            {isLoading ? (
                <ActivityIndicator
                    size="small"
                    color={buttonState === 'FOLLOWING' ? '#FF6B35' : '#FFFFFF'}
                />
            ) : (
                <Text style={getTextStyle()}>
                    {getButtonText()}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    // Base button styles
    button: {
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        // Glassmorphism effect
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },

    // Size variants
    button_small: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    button_medium: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    button_large: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },

    // State-specific button styles
    buttonFollow: {
        backgroundColor: '#FF6B35', // Sunset Orange (Brand Color)
        borderColor: '#FF6B35',
        // Add shadow for depth
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },

    buttonFollowing: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },

    buttonFollowBack: {
        backgroundColor: '#FF6B35',
        borderColor: '#FF6B35',
        // Stronger glow for "Follow Back" to draw attention
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 6,
    },

    buttonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        opacity: 0.5,
    },

    buttonLoading: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },

    // Text styles
    buttonText: {
        fontWeight: '600',
        textAlign: 'center',
    },

    buttonText_small: {
        fontSize: 12,
    },
    buttonText_medium: {
        fontSize: 14,
    },
    buttonText_large: {
        fontSize: 16,
    },

    textFollow: {
        color: '#FFFFFF',
    },

    textFollowing: {
        color: 'rgba(255, 255, 255, 0.9)',
    },

    textFollowBack: {
        color: '#FFFFFF',
        fontWeight: '700', // Bolder for emphasis
    },

    textDisabled: {
        color: 'rgba(255, 255, 255, 0.5)',
    },
});

export default FollowButton;
