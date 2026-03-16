import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Share2 } from 'lucide-react-native';
import SharePlaceModal from './SharePlaceModal';
import { useState } from 'react';

export default function VenueCard({ venue }) {
    const { colors } = useTheme();
    const [shareVisible, setShareVisible] = useState(false);

    return (
        <>
            <Link href={`/venue/${venue.id}`} asChild>
                <TouchableOpacity activeOpacity={0.9}>
                    <View style={[
                        styles.card,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            shadowColor: colors.shadow
                        }
                    ]}>
                        <Image
                            source={{ uri: venue.image }}
                            style={styles.image}
                        />

                        {/* Share Button (Overlay) */}
                        <TouchableOpacity
                            style={styles.shareBtn}
                            onPress={(e) => {
                                // Stop propagation to prevent navigation
                                e.stopPropagation();
                                setShareVisible(true);
                            }}
                        >
                            <Share2 size={16} color="#000" />
                        </TouchableOpacity>

                        <View style={styles.content}>
                            <View style={styles.header}>
                                <Text style={[styles.name, { color: colors.text }]}>{venue.name}</Text>
                                <View style={[styles.ratingBadge, { backgroundColor: colors.warning + '20' }]}>
                                    <Text style={[styles.ratingText, { color: colors.warning }]}>{venue.rating}</Text>
                                </View>
                            </View>
                            <Text style={[styles.type, { color: colors.textSecondary }]}>{venue.type} • {venue.area}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>

            <SharePlaceModal
                visible={shareVisible}
                onClose={() => setShareVisible(false)}
                placeId={venue.id}
                placeName={venue.name}
            />
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        marginBottom: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
        borderWidth: 1,
    },
    image: {
        width: '100%',
        height: 120,
    },
    shareBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        padding: 6,
    },
    content: {
        padding: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
    },
    ratingBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    type: {
        fontSize: 12,
    },
});

