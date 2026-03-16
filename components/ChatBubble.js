import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import ChatPlaceCard from './ChatPlaceCard';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { BadgeCheck } from 'lucide-react-native';

export default function ChatBubble({ message, isCurrentUser }) {
    const { colors } = useTheme();
    const [placeData, setPlaceData] = useState(null);

    useEffect(() => {
        if (message.placeId) {
            fetchPlaceData(message.placeId);
        }
    }, [message.placeId]);

    const fetchPlaceData = async (id) => {
        // In a real app, you might have this data cached or passed in differently.
        // For now, we fetch it on mount if a placeId exists.
        try {
            const docRef = doc(db, 'places', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setPlaceData({ id: docSnap.id, ...docSnap.data() });
            }
        } catch (e) {
            console.error("Error loading place preview:", e);
        }
    };

    return (
        <View style={[
            styles.container,
            isCurrentUser ? styles.right : styles.left
        ]}>
            <View style={[
                styles.bubble,
                isCurrentUser
                    ? { backgroundColor: Colors.primary }
                    : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
            ]}>
                {!isCurrentUser && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 }}>
                        <Text style={[styles.sender, { color: colors.textSecondary, marginBottom: 0 }]}>
                            {message.senderName}
                        </Text>
                        {message.senderRole === 'founder' && (
                            <BadgeCheck size={12} color="#FFD700" fill={colors.background} />
                        )}
                    </View>
                )}

                {message.text ? (
                    <Text style={[
                        styles.text,
                        { color: isCurrentUser ? '#fff' : colors.text }
                    ]}>
                        {message.text}
                    </Text>
                ) : null}

                {/* Shared Place Card */}
                {message.placeId && (
                    <View style={{ marginTop: message.text ? 8 : 0 }}>
                        <ChatPlaceCard place={placeData} />
                    </View>
                )}

                <Text style={[
                    styles.time,
                    { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
                ]}>
                    {message.createdAt?.seconds ? new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        width: '100%',
        alignItems: 'flex-start', // Default left
    },
    right: {
        alignItems: 'flex-end',
    },
    left: {
        alignItems: 'flex-start',
    },
    bubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '75%',
    },
    sender: {
        fontSize: 11,
        marginBottom: 4,
        fontWeight: '600',
    },
    text: {
        fontSize: 15,
        lineHeight: 20,
    },
    time: {
        fontSize: 10,
        marginTop: 4,
        textAlign: 'right',
    }
});
