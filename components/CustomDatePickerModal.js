import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

export default function CustomDatePickerModal({ visible, onClose, onDateSelected, initialDate }) {
    const { colors } = useTheme();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());

    useEffect(() => {
        if (visible) {
            const date = initialDate ? new Date(initialDate) : new Date();
            if (!isNaN(date.getTime())) {
                setSelectedYear(date.getFullYear());
                setSelectedMonth(date.getMonth());
                setSelectedDay(date.getDate());
            }
        }
    }, [visible, initialDate]);

    // Data generation
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i); // Last 100 years
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1);

    const handleConfirm = () => {
        const date = new Date(selectedYear, selectedMonth, selectedDay);
        onDateSelected(date);
        onClose();
    };

    const renderItem = (item, selectedValue, onSelect) => (
        <TouchableOpacity
            style={[
                styles.item,
                item === selectedValue && { backgroundColor: Colors.primary }
            ]}
            onPress={() => onSelect(item)}
        >
            <Text style={[
                styles.itemText,
                { color: colors.text },
                item === selectedValue && { color: '#fff', fontWeight: 'bold' }
            ]}>
                {item}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={[styles.cancelText, { color: colors.icon }]}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: colors.text }]}>Select Date</Text>
                        <TouchableOpacity onPress={handleConfirm}>
                            <Text style={[styles.confirmText, { color: Colors.primary }]}>Confirm</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pickerContainer}>
                        {/* Day Column */}
                        <View style={styles.column}>
                            <Text style={[styles.columnHeader, { color: colors.text }]}>Day</Text>
                            <FlatList
                                data={days}
                                keyExtractor={(item) => item.toString()}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => renderItem(item, selectedDay, setSelectedDay)}
                                initialNumToRender={10}
                            />
                        </View>

                        {/* Month Column */}
                        <View style={[styles.column, { flex: 1.5 }]}>
                            <Text style={[styles.columnHeader, { color: colors.text }]}>Month</Text>
                            <FlatList
                                data={months}
                                keyExtractor={(item) => item}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item, index }) => renderItem(item, months[selectedMonth], (val) => setSelectedMonth(months.indexOf(val)))}
                                initialNumToRender={12}
                            />
                        </View>

                        {/* Year Column */}
                        <View style={styles.column}>
                            <Text style={[styles.columnHeader, { color: colors.text }]}>Year</Text>
                            <FlatList
                                data={years}
                                keyExtractor={(item) => item.toString()}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => renderItem(item, selectedYear, setSelectedYear)}
                                initialNumToRender={10}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: 400,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelText: {
        fontSize: 16,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    pickerContainer: {
        flexDirection: 'row',
        flex: 1,
        gap: 8,
    },
    column: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 8,
        padding: 4,
    },
    columnHeader: {
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 8,
        fontSize: 14,
        opacity: 0.7,
    },
    item: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 4,
    },
    itemText: {
        fontSize: 16,
    },
});
