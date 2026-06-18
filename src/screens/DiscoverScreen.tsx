import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Search, SlidersHorizontal, Star, MapPin, X } from 'lucide-react-native';
import { Business } from '../types/schema';
import { useFounderPicks } from '../hooks/useFounderPicks';
import { useBusinesses } from '../hooks/useBusinesses';

const MOODS = ['Popular', 'Cozy', 'Relax', 'Loud', 'Luxurious', 'Family', 'Work'];
const CATEGORIES = ['All', 'Cafe', 'Restaurant', 'Lounge'];
const PRICES = ['All', '$', '$$', '$$$', '$$$$', '$$$$$'];
const RATINGS = ['All', '4.0+', '4.5+'];

interface BusinessCardProps {
  business: Business;
  isFounderPick: boolean;
  onPress: () => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, isFounderPick, onPress }) => {
  // Safe extraction of features/attributes (up to 3 badges for UI cleanliness)
  const displayFeatures = business.features ? business.features.slice(0, 3) : [];
  
  // Safe extraction of image
  const coverImage = business.images && business.images.length > 0 
    ? business.images[0] 
    : 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';

  return (
    <TouchableOpacity style={[styles.card, isFounderPick && styles.founderCard]} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: coverImage }}
        style={styles.cardImage}
        contentFit="cover"
        transition={200}
      />
      
      {isFounderPick && (
        <View style={styles.founderPickBadge}>
          <Text style={styles.founderPickText}>👑 Founder Pick</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{business.name}</Text>
          <View style={styles.ratingContainer}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>{business.ratingAvg ? business.ratingAvg.toFixed(1) : '0.0'}</Text>
          </View>
        </View>

        <Text style={styles.cardCategory}>{business.category} • {business.priceRange}</Text>
        
        <Text style={styles.cardDescription} numberOfLines={2}>{business.description}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.badgeContainer}>
            {displayFeatures.map((feature, i) => (
              <Text key={i} style={styles.featureBadge}>{feature}</Text>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState('Popular');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const { data: founderPicksData } = useFounderPicks();

  // Convert filter selections to hook parameters
  const minRatingVal = selectedRating === '4.0+' ? 4.0 : selectedRating === '4.5+' ? 4.5 : undefined;
  const priceVal = selectedPrice === 'All' ? undefined : selectedPrice;
  const categoryVal = selectedCategory === 'All' ? undefined : selectedCategory;

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useBusinesses({
    mood: selectedMood,
    priceRange: priceVal,
    category: categoryVal,
    minRating: minRatingVal,
    searchQuery: searchQuery.trim() !== '' ? searchQuery : undefined,
    pageSize: 10,
  });

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const businesses = data ? data.pages.flatMap((page: any) => page.data) : [];

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedPrice('All');
    setSelectedRating('All');
    setSearchQuery('');
  };

  const activeFiltersCount = 
    (selectedCategory !== 'All' ? 1 : 0) + 
    (selectedPrice !== 'All' ? 1 : 0) + 
    (selectedRating !== 'All' ? 1 : 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Search Area */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>2Where?</Text>
        <Text style={styles.headerSubtitle}>Discover your next outing mood ✨</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBarContainer}>
          <Search size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cafes, restaurants..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#888" style={{ marginRight: 8 }} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.filterToggleButton, showFilters && styles.filterToggleButtonActive]} 
          onPress={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={20} color={showFilters ? '#FFF' : '#FF6B00'} />
          {activeFiltersCount > 0 && !showFilters && (
            <View style={styles.filterBadgeCount}>
              <Text style={styles.filterBadgeCountText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterPanelHeader}>
            <Text style={styles.filterPanelTitle}>Refine Outings</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter */}
          <Text style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Price Filter */}
          <Text style={styles.filterLabel}>Price Range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {PRICES.map(pr => (
              <TouchableOpacity
                key={pr}
                style={[styles.chip, selectedPrice === pr && styles.chipActive]}
                onPress={() => setSelectedPrice(pr)}
              >
                <Text style={[styles.chipText, selectedPrice === pr && styles.chipTextActive]}>{pr}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Rating Filter */}
          <Text style={styles.filterLabel}>Minimum Rating</Text>
          <View style={styles.filterRow}>
            {RATINGS.map(rt => (
              <TouchableOpacity
                key={rt}
                style={[styles.chip, selectedRating === rt && styles.chipActive]}
                onPress={() => setSelectedRating(rt)}
              >
                <Text style={[styles.chipText, selectedRating === rt && styles.chipTextActive]}>{rt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Mood Chips Bar */}
      <View style={styles.moodsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {MOODS.map(mood => (
            <TouchableOpacity
              key={mood}
              style={[styles.moodChip, selectedMood === mood && styles.moodChipActive]}
              onPress={() => setSelectedMood(mood)}
            >
              <Text style={[styles.moodText, selectedMood === mood && styles.moodTextActive]}>{mood}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Section */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error loading places. Please try again.</Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(item) => item.businessId}
          renderItem={({ item }) => (
            <BusinessCard
              business={item}
              isFounderPick={founderPicksData?.has(item.businessId) || false}
              onPress={() => navigation.navigate('PlaceDetails', { business: item })}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: 20 }} color="#FF6B00" /> : null}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No outings found matching the filters.</Text>
              <TouchableOpacity style={styles.resetSearchButton} onPress={resetFilters}>
                <Text style={styles.resetSearchButtonText}>Reset Filters & Search</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 60 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#111' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  searchSection: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  searchBarContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  searchIcon: { marginLeft: 12, marginRight: 8 },
  searchInput: { flex: 1, height: 48, fontSize: 15, color: '#111' },
  filterToggleButton: { width: 48, height: 48, backgroundColor: '#FFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5E5', position: 'relative' },
  filterToggleButtonActive: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  filterBadgeCount: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  filterBadgeCountText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  // Filter Panel
  filterPanel: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  filterPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  filterPanelTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  clearFiltersText: { color: '#FF6B00', fontSize: 13, fontWeight: '600' },
  filterLabel: { fontSize: 12, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  filterRow: { flexDirection: 'row', marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8 },
  chipActive: { backgroundColor: '#FF6B00' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },

  // Moods Bar
  moodsBar: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  moodChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#EEEEEE', marginRight: 8 },
  moodChipActive: { backgroundColor: '#FF6B00' },
  moodText: { fontWeight: '600', color: '#666', fontSize: 14 },
  moodTextActive: { color: '#FFF' },

  // List Cards
  card: { backgroundColor: '#FFF', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#EEE' },
  founderCard: { borderColor: '#FFD700', borderWidth: 1.5, shadowColor: '#FFD700', shadowOpacity: 0.15 },
  cardImage: { width: '100%', height: 160 },
  founderPickBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#FFF9D6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700', zIndex: 1 },
  founderPickText: { color: '#B8860B', fontSize: 11, fontWeight: 'bold' },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', flex: 1, marginRight: 10 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: 'bold', color: '#111' },
  cardCategory: { fontSize: 13, color: '#FF6B00', fontWeight: '600', marginBottom: 8 },
  cardDescription: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeContainer: { flexDirection: 'row', gap: 6 },
  featureBadge: { backgroundColor: '#F5F5F5', color: '#555', fontSize: 11, fontWeight: '500', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, overflow: 'hidden' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 15, color: '#FF3B30', textAlign: 'center', marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 16 },
  resetSearchButton: { backgroundColor: '#FF6B00', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  resetSearchButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});