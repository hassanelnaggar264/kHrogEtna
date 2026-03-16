import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToGroups, sendMessage } from '../services/chatService';
import { X, Send } from 'lucide-react-native';

export default function SharePlaceModal({ visible, onClose, placeId, placeName }) {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!user || !visible) return;
        setLoading(true);
        // Subscribe to groups to show list
        const unsubscribe = subscribeToGroups(user.uid, (data) => {
            setGroups(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, visible]);

    const handleSend = async (groupId) => {
        if (sending) return;
        setSending(true);
        try {
            await sendMessage(
                groupId,
                `Check out this place: ${placeName}`,
                user,
                placeId
            );
            onClose(); // Close modal on success
            // Optional: Show toast or feedback
        } catch (error) {
            console.error("Failed to share place:", error);
        } finally {
            setSending(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => handleSend(item.id)}
            disabled={sending}
        >
            <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.subText, { color: colors.textSecondary }]}>
                    {item.members.length} members
                </Text>
            </View>
            <Send size={20} color={Colors.primary} />
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>Share to...</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator color={Colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={groups}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={{ padding: 16 }}
                            ListEmptyComponent={
                                <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textSecondary }}>
                                    No groups found. Create one in Chats!
                                </Text>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: '60%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '500',
    },
    subText: {
        fontSize: 12,
        marginTop: 2,
    }
});
