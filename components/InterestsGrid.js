import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';
import { Check, Coffee, UtensilsCrossed, Moon, BookOpen, Gamepad2, Laptop, Users, Tv, PawPrint, Sun } from 'lucide-react-native';

const INTERESTS = [
    { id: 'food', label: 'Food & Dining', icon: UtensilsCrossed },
    { id: 'coffee', label: 'Coffee & Cafes', icon: Coffee },
    { id: 'nightlife', label: 'Nightlife', icon: Moon },
    { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
    { id: 'reading', label: 'Books & Reading', icon: BookOpen },
    { id: 'work', label: 'Work & Study', icon: Laptop },
    { id: 'rooftops', label: 'Rooftops', icon: Sun },
    { id: 'family', label: 'Family Friendly', icon: Users },
    { id: 'matches', label: 'Watching Matches', icon: Tv },
    { id: 'pets', label: 'Pet Friendly', icon: PawPrint },
];

export default function InterestsGrid({ selectedInterests, toggleInterest, scrollable = true }) {
    const { colors } = useTheme();

    const GridContent = () => (
        <View style={styles.grid}>
            {INTERESTS.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                const Icon = item.icon;
                return (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.card,
                            {
                                backgroundColor: isSelected ? '#FFF0E0' : colors.card,
                                borderColor: isSelected ? Colors.primary : colors.border
                            }
                        ]}
                        onPress={() => toggleInterest(item.id)}
                        activeOpacity={0.7}
                    >
                        <View style={[
                            styles.iconContainer,
                            isSelected && { backgroundColor: Colors.primary }
                        ]}>
                            <Icon size={24} color={isSelected ? '#fff' : colors.text} />
                        </View>
                        <Text style={[
                            styles.cardLabel,
                            { color: isSelected ? Colors.primary : colors.text, fontWeight: isSelected ? '700' : '500' }
                        ]}>
                            {item.label}
                        </Text>
                        {isSelected && (
                            <View style={styles.checkIcon}>
                                <Check size={16} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    if (scrollable) {
        return (
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <GridContent />
            </ScrollView>
        );
    }

    return <GridContent />;
}

const styles = StyleSheet.create({
    scrollContainer: {
        paddingBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    card: {
        width: '48%',
        aspectRatio: 1.1,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 14,
        textAlign: 'center',
    },
    checkIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: Colors.primary,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
