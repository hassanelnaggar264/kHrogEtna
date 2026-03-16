import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Colors } from '../constants/Colors';
import { Heart, MessageCircle, Bookmark, Share2, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure you have this or use a simple view with opacity
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
// Height correction for tab bar if needed, but we want full screen immersive
// We will rely on SafeArea handling or just take full height as requested.

import { useRouter } from 'expo-router';

export default function VideoFeedItem({ item, isActive }) {
    const router = useRouter();
    const videoRef = useRef(null);
    const [status, setStatus] = useState({});
    const [liked, setLiked] = useState(item.isLiked);
    const [likesCount, setLikesCount] = useState(item.likes);

    useEffect(() => {
        if (isActive) {
            videoRef.current?.playAsync();
        } else {
            videoRef.current?.pauseAsync();
        }
    }, [isActive]);

    const toggleLike = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (liked) {
            setLikesCount(prev => prev - 1);
        } else {
            setLikesCount(prev => prev + 1);
        }
        setLiked(!liked);
    };

    const handleVisitProfile = () => {
        if (item.venueId) {
            router.push(`/venue/${item.venueId}`);
        }
    };

    return (
        <View style={styles.container}>
            <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: item.videoUrl }}
                resizeMode={ResizeMode.COVER}
                isLooping
                onPlaybackStatusUpdate={status => setStatus(() => status)}
            />

            {/* Content Overlay */}
            <View style={styles.overlay}>

                {/* Right Action Sidebar */}
                <View style={styles.rightSidebar}>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
                        <View style={styles.followBadge}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>+</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.actionBtn} onPress={toggleLike}>
                        <Heart size={30} color={liked ? "#FF2D55" : "#fff"} fill={liked ? "#FF2D55" : "transparent"} />
                        <Text style={styles.actionText}>{likesCount}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <MessageCircle size={30} color="#fff" />
                        <Text style={styles.actionText}>24</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <Bookmark size={30} color="#fff" />
                        <Text style={styles.actionText}>Save</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn}>
                        <Share2 size={30} color="#fff" />
                        <Text style={styles.actionText}>Share</Text>
                    </TouchableOpacity>
                </View>

                {/* Bottom Info Section */}
                <View style={styles.bottomInfo}>
                    <TouchableOpacity onPress={handleVisitProfile} style={styles.venueRow}>
                        <Text style={styles.venueName}>{item.venueName}</Text>
                        {/* Location Pill */}
                        <View style={styles.locPill}>
                            <MapPin size={12} color="#fff" />
                            <Text style={styles.locText}>{item.location}</Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.caption}>{item.caption}</Text>
                </View>

            </View>

            {/* Gradient for readability at bottom if we had expo-linear-gradient, 
                for now using backgroundColor with opacity in styles.bottomInfo parent could work, 
                but let's assume no gradient lib installed to be safe, using simpler protection */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        height: height - (Platform.OS === 'ios' ? 70 : 50), // Adjust for TabBar if visible, or full height
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 80, // Above tab bar
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    rightSidebar: {
        position: 'absolute',
        right: 10,
        bottom: 100, // Move up a bit
        alignItems: 'center',
        gap: 20,
    },
    avatarContainer: {
        marginBottom: 10,
        position: 'relative'
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#fff',
    },
    followBadge: {
        position: 'absolute',
        bottom: -8,
        alignSelf: 'center',
        backgroundColor: Colors.primary,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtn: {
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    bottomInfo: {
        flex: 1,
        marginRight: 60, // Space for sidebar
        justifyContent: 'flex-end',
    },
    venueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 8,
        gap: 8,
    },
    venueName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    locPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    locText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    caption: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 22,
        opacity: 0.9,
    },
});
