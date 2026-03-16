/**
 * UserListItem.jsx
 * User list item component for search results and contact lists
 * Features special styling for Founder (Hassan Elnaggar) with Golden Crown 👑 and Neon Glow
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const UserListItem = ({
    user,
    onPress,
    currentUserId,
    showFollowButton = true,
    FollowButtonComponent, // Pass FollowButton component as prop
}) => {
    const isFounder = user.isFounder === true || user.username === 'Hassan Elnaggar';
    const isSelf = user.uid === currentUserId;

    return (
        <TouchableOpacity
            style={[styles.container, isFounder && styles.founderContainer]}
            onPress={() => onPress(user)}
            activeOpacity={0.7}
        >
            {/* Neon Glow Effect for Founder */}
            {isFounder && (
                <LinearGradient
                    colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.1)', 'transparent']}
                    style={styles.founderGlow}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            )}

            <View style={styles.contentContainer}>
                {/* Profile Picture */}
                <View style={[styles.avatarContainer, isFounder && styles.founderAvatarContainer]}>
                    {user.profilePic ? (
                        <Image
                            source={{ uri: user.profilePic }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {user.username?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}

                    {/* Golden Crown for Founder */}
                    {isFounder && (
                        <View style={styles.crownBadge}>
                            <Text style={styles.crownEmoji}>👑</Text>
                        </View>
                    )}
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <View style={styles.usernameRow}>
                        <Text style={[styles.username, isFounder && styles.founderUsername]}>
                            {user.username}
                        </Text>
                        {isFounder && (
                            <Text style={styles.founderLabel}>FOUNDER</Text>
                        )}
                    </View>

                    {/* Follower Stats */}
                    <Text style={styles.stats}>
                        {formatNumber(user.followersCount || 0)} followers · {formatNumber(user.followingCount || 0)} following
                    </Text>
                </View>

                {/* Follow Button */}
                {showFollowButton && !isSelf && FollowButtonComponent && (
                    <View style={styles.buttonContainer}>
                        {FollowButtonComponent}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

/**
 * Format large numbers (1000 -> 1K, 1000000 -> 1M)
 */
const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        // Glassmorphism base
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },

    founderContainer: {
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.5)', // Golden border
        // Enhanced shadow for founder
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },

    founderGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 12,
    },

    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },

    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },

    founderAvatarContainer: {
        // Add golden ring around founder avatar
        padding: 2,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
    },

    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },

    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FF6B35',
    },

    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    crownBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 215, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        // Glow effect
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 5,
    },

    crownEmoji: {
        fontSize: 14,
    },

    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },

    usernameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },

    username: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginRight: 8,
    },

    founderUsername: {
        color: '#FFD700', // Golden text for founder
        fontWeight: '700',
        // Text shadow for extra glow
        textShadowColor: 'rgba(255, 215, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },

    founderLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },

    stats: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },

    buttonContainer: {
        marginLeft: 12,
    },
});

export default UserListItem;
