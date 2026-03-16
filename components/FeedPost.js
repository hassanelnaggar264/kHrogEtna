import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { MapPin, UserPlus, Heart, MessageCircle, Send } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function FeedPost({ post, onJoin }) {
    const { colors } = useTheme();

    return (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={styles.header}>
                <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.userName, { color: colors.text }]}>{post.user.name}</Text>
                    <Text style={[styles.userHandle, { color: colors.icon }]}>@{post.user.username}</Text>
                </View>
                <Text style={[styles.time, { color: colors.icon }]}>{post.time}</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Image source={{ uri: post.image }} style={styles.postImage} />
                <View style={styles.venueTag}>
                    <MapPin size={14} color="#fff" />
                    <Text style={styles.venueText}>{post.venue.name}</Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.footer}>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Heart size={24} color={colors.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                        <MessageCircle size={24} color={colors.icon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Send size={24} color={colors.icon} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.joinBtn, { backgroundColor: Colors.primary }]}
                    onPress={() => onJoin(post.id)}
                >
                    <Text style={styles.joinBtnText}>I'm Going ({post.joined})</Text>
                </TouchableOpacity>
            </View>

            {/* Caption */}
            <View style={styles.captionContainer}>
                <Text style={[styles.caption, { color: colors.text }]}>
                    <Text style={{ fontWeight: 'bold' }}>{post.user.username}</Text> {post.caption}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        borderRadius: 16, // TikTok/Instagram modern style
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    userName: {
        fontWeight: '700',
        fontSize: 15,
    },
    userHandle: {
        fontSize: 13,
    },
    time: {
        fontSize: 12,
    },
    content: {
        position: 'relative',
        width: '100%',
        aspectRatio: 4 / 5, // Instagram Portrait Ratio
    },
    postImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    venueTag: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    venueText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    footer: {
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
    },
    joinBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    joinBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    captionContainer: {
        paddingHorizontal: 12,
        paddingBottom: 16,
    },
    caption: {
        fontSize: 14,
        lineHeight: 20,
    },
});
