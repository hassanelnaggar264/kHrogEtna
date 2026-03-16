import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import { MapPin, Star } from 'lucide-react-native';
import { Colors } from '../constants/Colors';

export default function ChatPlaceCard({ place, onPress }) {
    const { colors } = useTheme();
    const router = useRouter();

    if (!place) return null;

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push(`/venue/${place.id}`);
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handlePress}
        >
            {/* Image Section */}
            <Image
                source={{ uri: place.image || 'https://via.placeholder.com/150' }}
                style={styles.image}
            />

            {/* Content Section */}
            <View style={styles.content}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {place.name}
                </Text>

                <View style={styles.row}>
                    <MapPin size={12} color={colors.textSecondary} />
                    <Text style={[styles.subText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {place.area || place.city}
                    </Text>
                </View>

                {place.rating > 0 && (
                    <View style={[styles.row, { marginTop: 4 }]}>
                        <Star size={12} color="#FFD700" fill="#FFD700" />
                        <Text style={[styles.rating, { color: colors.text }]}>
                            {place.rating}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 200,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        marginTop: 4,
    },
    image: {
        width: '100%',
        height: 100,
        backgroundColor: '#eee',
    },
    content: {
        padding: 8,
    },
    name: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    subText: {
        fontSize: 11,
    },
    rating: {
        fontSize: 11,
        fontWeight: '600',
    }
});
