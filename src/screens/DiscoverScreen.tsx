import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { Business } from '../types/schema';
import { useFounderPicks } from '../hooks/useFounderPicks';
import { useBusinesses } from '../hooks/useBusinesses';

// Mock filters for MVP iteration
const MOODS = ['Popular', 'Relax', 'Work', 'Date', 'Family'];

const BusinessCard = ({ business, isFounderPick }: { business: Business, isFounderPick: boolean }) => {
  return (
    <View style={[styles.card, isFounderPick && styles.founderCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{business.name}</Text>
        {isFounderPick && (
          <View style={styles.founderPickBadge}>
            <Text style={styles.founderPickText}>👑 Pick</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardSubtitle}>{business.category} • {business.priceRange}</Text>
      <Text style={styles.cardRating}>⭐ {business.ratingAvg.toFixed(1)} ({business.ratingCount})</Text>
      <View style={styles.moodContainer}>
        {business.moods.map((m, i) => (
          <Text key={i} style={styles.moodBadge}>{m}</Text>
        ))}
      </View>
    </View>
  );
};

export default function DiscoverScreen() {
  const [selectedMood, setSelectedMood] = useState('Popular');
  const { data: founderPicksData } = useFounderPicks();

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useBusinesses({
    mood: selectedMood === 'Popular' ? undefined : selectedMood,
    pageSize: 10,
  });

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const businesses = data ? data.pages.flatMap((page: any) => page.data) : [];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Discover 2Where?</Text>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MOODS.map(mood => (
            <TouchableOpacity
              key={mood}
              style={[styles.filterChip, selectedMood === mood && styles.filterChipActive]}
              onPress={() => setSelectedMood(mood)}>
              <Text style={[styles.filterText, selectedMood === mood && styles.filterTextActive]}>{mood}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text>Error loading places.</Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(item) => item.businessId}
          renderItem={({ item }) => (
            <BusinessCard
              business={item}
              isFounderPick={founderPicksData?.has(item.businessId) || false}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ margin: 20 }} color="#FF6B00" /> : null}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={{ color: '#888' }}>No places found for {selectedMood}.</Text>
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
  headerTitle: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, color: '#111' },
  filtersContainer: { paddingLeft: 20, paddingBottom: 15 },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#EEEEEE',
    marginRight: 10
  },
  filterChipActive: { backgroundColor: '#FF6B00' },
  filterText: { fontWeight: '600', color: '#666' },
  filterTextActive: { color: '#FFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  founderCard: {
    borderColor: '#FFD700',
    borderWidth: 1.5,
    shadowColor: '#FFD700',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', flex: 1 },
  founderPickBadge: { backgroundColor: '#FFF9D6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#FFD700', marginLeft: 10 },
  founderPickText: { color: '#B8860B', fontSize: 12, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: '#888', marginBottom: 8 },
  cardRating: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  moodContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  moodBadge: { backgroundColor: '#FFF5EB', color: '#FF6B00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontWeight: '500', overflow: 'hidden' }
})