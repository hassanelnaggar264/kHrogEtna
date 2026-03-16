import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Switch, FlatList } from 'react-native';
import { X, MapPin, Star, ChevronDown, CheckCircle } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { GOVERNORATES, CITIES, FEATURES } from '../utils/constants';
import { useTheme } from '../context/ThemeContext';

export default function FilterModal({
    visible,
    onClose,
    nearbyEnabled,
    setNearbyEnabled,
    selectedGov,
    setSelectedGov,
    selectedCity,
    setSelectedCity,
    minRating,
    setMinRating,
    openNow,
    setOpenNow,
    selectedFeatures,
    setSelectedFeatures,
    onReset,
    onSave
}) {
    const { colors } = useTheme();

    // Local state for pickers
    const [showGovPicker, setShowGovPicker] = useState(false);
    const [showAreaPicker, setShowAreaPicker] = useState(false);

    const handleFeatureToggle = (feat) => {
        setSelectedFeatures(prev => prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]);
    };

    // Helper to render selection modals (Custom Picker)
    const renderPickerModal = (visible, setVisible, title, data, onSelect, selectedValue) => (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setVisible(false)}
        >
            <TouchableOpacity
                style={styles.pickerOverlay}
                activeOpacity={1}
                onPress={() => setVisible(false)}
            >
                <View style={[styles.pickerContent, { backgroundColor: colors.background }]}>
                    <View style={styles.pickerHeader}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>{title}</Text>
                        <TouchableOpacity onPress={() => setVisible(false)}>
                            <X size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={item => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.pickerItem, item === selectedValue && { backgroundColor: Colors.primary + '20' }]}
                                onPress={() => {
                                    onSelect(item);
                                    setVisible(false);
                                }}
                            >
                                <Text style={[styles.pickerItemText, { color: colors.text }, item === selectedValue && { color: Colors.primary, fontWeight: 'bold' }]}>
                                    {item}
                                </Text>
                                {item === selectedValue && <CheckCircle size={18} color={Colors.primary} />}
                            </TouchableOpacity>
                        )}
                        style={{ maxHeight: 300 }}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>

                        {/* --- LOCATION SECTION (Strict 3-Button Row) --- */}
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Location</Text>

                        <View style={styles.locationRow}>

                            {/* 1. Nearby Me Button */}
                            <TouchableOpacity
                                style={[
                                    styles.pillButton,
                                    nearbyEnabled
                                        ? { backgroundColor: '#FF5722', borderWidth: 0 }
                                        : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
                                ]}
                                onPress={() => {
                                    setNearbyEnabled(true);
                                    setSelectedGov(null);
                                    setSelectedCity(null);
                                }}
                            >
                                <MapPin size={16} color={nearbyEnabled ? '#fff' : colors.text} style={{ marginRight: 6 }} />
                                <Text style={[styles.pillText, { color: nearbyEnabled ? '#fff' : colors.text, fontWeight: '600' }]}>Nearby me</Text>
                            </TouchableOpacity>

                            {/* 2. Governorate Picker Button */}
                            <TouchableOpacity
                                style={[
                                    styles.pillButton,
                                    selectedGov
                                        ? { backgroundColor: '#FF5722', borderWidth: 0, flex: 1, justifyContent: 'space-between' }
                                        : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flex: 1, justifyContent: 'space-between' }
                                ]}
                                onPress={() => setShowGovPicker(true)}
                            >
                                <Text style={[styles.pillText, { color: selectedGov ? '#fff' : colors.text, fontWeight: selectedGov ? '700' : '400' }]} numberOfLines={1}>
                                    {selectedGov || 'Governorate'}
                                </Text>
                                <ChevronDown size={16} color={selectedGov ? '#fff' : colors.textSecondary} />
                            </TouchableOpacity>

                            {/* 3. Area Picker Button */}
                            <TouchableOpacity
                                style={[
                                    styles.pillButton,
                                    selectedCity
                                        ? { backgroundColor: '#FF5722', borderWidth: 0, flex: 1, justifyContent: 'space-between' }
                                        : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flex: 1, justifyContent: 'space-between', opacity: selectedGov ? 1 : 0.5 }
                                ]}
                                onPress={() => selectedGov && setShowAreaPicker(true)}
                                disabled={!selectedGov}
                            >
                                <Text style={[styles.pillText, { color: selectedCity ? '#fff' : colors.text, fontWeight: selectedCity ? '700' : '400' }]} numberOfLines={1}>
                                    {selectedCity || 'Area'}
                                </Text>
                                <ChevronDown size={16} color={selectedCity ? '#fff' : colors.textSecondary} />
                            </TouchableOpacity>

                        </View>

                        {/* Render Selection Modals */}
                        {renderPickerModal(
                            showGovPicker,
                            setShowGovPicker,
                            "Select Governorate",
                            GOVERNORATES,
                            (gov) => {
                                setSelectedGov(gov);
                                setNearbyEnabled(false);
                                setSelectedCity(null); // Reset area when gov changes
                            },
                            selectedGov
                        )}

                        {renderPickerModal(
                            showAreaPicker,
                            setShowAreaPicker,
                            "Select Area",
                            selectedGov ? (CITIES[selectedGov] || []) : [],
                            (city) => setSelectedCity(city),
                            selectedCity
                        )}


                        {/* --- RATING SECTION --- */}
                        <Text style={[styles.sectionHeader, { color: colors.text, marginTop: 24 }]}>Minimum Rating: {minRating > 0 ? minRating : 'Any'}</Text>
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setMinRating(star === minRating ? 0 : star)}
                                    style={styles.starBtn}
                                >
                                    <Star
                                        size={32}
                                        color={minRating >= star ? "#FFD700" : colors.border}
                                        fill={minRating >= star ? "#FFD700" : "transparent"}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* --- OPEN NOW --- */}
                        <View style={[styles.rowBetween, { marginTop: 24 }]}>
                            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Open Now</Text>
                            <Switch
                                value={openNow}
                                onValueChange={setOpenNow}
                                trackColor={{ true: Colors.success || '#4CAF50' }}
                            />
                        </View>

                        {/* --- FEATURES --- */}
                        <Text style={[styles.sectionHeader, { color: colors.text, marginTop: 24 }]}>Features</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {FEATURES.map(feat => (
                                <TouchableOpacity
                                    key={feat}
                                    style={[styles.modalChip, selectedFeatures.includes(feat) && { backgroundColor: Colors.secondary }]}
                                    onPress={() => handleFeatureToggle(feat)}
                                >
                                    <Text style={[styles.modalChipText, selectedFeatures.includes(feat) && { color: '#fff' }]}>{feat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={[styles.footerBtn, styles.btnOutline, { borderColor: colors.border }]} onPress={onReset}>
                            <Text style={{ color: colors.text }}>Reset All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.footerBtn, { backgroundColor: Colors.primary }]} onPress={() => { onSave(); onClose(); }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    sectionHeader: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

    // Updated Location Row Styles
    locationRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    pillButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 30, flexShrink: 1 },
    pillText: { fontSize: 13 },

    // Picker Modal Styles
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    pickerContent: { borderRadius: 16, padding: 16, maxHeight: '50%' },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    pickerTitle: { fontSize: 16, fontWeight: '700' },
    pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    pickerItemText: { fontSize: 14 },

    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, backgroundColor: '#f9f9f9', marginBottom: 4 },
    modalChipText: { fontSize: 14, fontWeight: '600', color: '#333' },
    ratingRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginVertical: 8 },
    starBtn: { padding: 4 },
    modalFooter: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
    footerBtn: { flex: 1, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    btnOutline: { borderWidth: 1, backgroundColor: 'transparent' }
});
