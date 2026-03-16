import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { Plus } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function StoriesRail() {
    const { user } = useAuth();
    const { colors } = useTheme();

    // Mock Stories Data
    const stories = [
        { id: 's1', name: 'You', isUser: true },
        { id: 's2', name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=u1', hasStory: true },
        { id: 's3', name: 'Ahmed', avatar: 'https://i.pravatar.cc/150?u=u2', hasStory: true },
        { id: 's4', name: 'Lina', avatar: 'https://i.pravatar.cc/150?u=u3', hasStory: true },
        { id: 's5', name: 'Kareem', avatar: 'https://i.pravatar.cc/150?u=u4', hasStory: true },
        { id: 's6', name: 'Mona', avatar: 'https://i.pravatar.cc/150?u=5', hasStory: true },
    ];

    return (
        <View style={[styles.container, { borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {stories.map((story, index) => (
                    <TouchableOpacity key={story.id} style={styles.storyItem}>
                        <View style={styles.avatarContainer}>
                            {story.isUser ? (
                                <View style={styles.userStoryContainer}>
                                    <Image
                                        source={{ uri: user?.photoURL || 'https://i.pravatar.cc/150?u=me' }}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.addBadge}>
                                        <Plus size={12} color="#fff" strokeWidth={3} />
                                    </View>
                                </View>
                            ) : (
                                <View style={[styles.storyRing, { borderColor: Colors.primary }]}>
                                    <Image source={{ uri: story.avatar }} style={styles.avatar} />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.storyName, { color: colors.text }]}>
                            {story.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8, // Reduced from 12
        borderBottomWidth: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 12, // Reduced from 16
        gap: 12, // Reduced from 16
    },
    storyItem: {
        alignItems: 'center',
        width: 70, // Fixed width for alignment
    },
    avatarContainer: {
        marginBottom: 6,
        position: 'relative',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#000', // Gap between ring and image
    },
    storyRing: {
        padding: 2, // Space for gradient border
        borderWidth: 2.5, // 2.5px solid color (simulating gradient for now)
        borderRadius: 40,
    },
    userStoryContainer: {
        position: 'relative',
        padding: 2,
    },
    addBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#007AFF',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    storyName: {
        fontSize: 11,
        fontWeight: '500',
    },
});
