import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Image } from 'expo-image';
// import MapView, { Marker } from 'react-native-maps'; // Disabled for Expo Go
import { useRoute } from '@react-navigation/native';
import { Business } from '../types/schema';
import { GeoPoint } from 'firebase/firestore';
import { useRatings } from '../hooks/useRatings';

const { width } = Dimensions.get('window');

type RouteParams = { business: Business };

const MOCK_BUSINESS: Business = {
  businessId: 'mock1',
  ownerId: 'ownermock',
  name: "Espresso Lab (Mock)",
  description: "A premium specialty coffee experience with a relaxing atmosphere.",
  category: "Cafe",
  moods: ["Work", "Coffee", "Relax"],
  priceRange: "$$",
  location: new GeoPoint(30.0444, 31.2357),
  ratingAvg: 4.8,
  ratingCount: 312,
  images: ["https://picsum.photos/400/300?random=1", "https://picsum.photos/400/300?random=2"],
  openingHours: "08:00 AM - 11:00 PM",
  features: ["WiFi", "Outdoor Seating", "Parking"],
  menu: [],
  createdAt: {} as any
};

const openInGoogleMaps = (latitude: number, longitude: number, name: string) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_name=${encodeURIComponent(name)}`;
  Linking.openURL(url);
};

export default function BusinessProfileScreen() {
  const route = useRoute();
  const business: Business = (route.params as RouteParams)?.business || MOCK_BUSINESS;

  const { data: ratingsData, isLoading: ratingsLoading, hasNextPage, fetchNextPage } = useRatings({
    businessId: business.businessId,
    pageSize: 5
  });

  const ratings = ratingsData ? ratingsData.pages.flatMap(p => p.data) : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Gallery Section */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {business.images.map((imgUri, index) => (
            <Image
              key={index}
              source={{ uri: imgUri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ))}
        </ScrollView>

        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>{business.name}</Text>
          <Text style={styles.category}>{business.category} • {business.priceRange}</Text>
          <Text style={styles.description}>{business.description}</Text>
          <Text style={styles.rating}>⭐ {business.ratingAvg.toFixed(1)} ({business.ratingCount} reviews)</Text>
        </View>

        {/* Map Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          {/* MapView disabled — react-native-maps requires a dev build, not supported in Expo Go */}
          {/*
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: business.location.latitude,
                longitude: business.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
            >
              <Marker coordinate={{ latitude: business.location.latitude, longitude: business.location.longitude }} />
            </MapView>
          </View>
          */}

          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderIcon}>📍</Text>
            <Text style={styles.mapPlaceholderTitle}>{business.name}</Text>
            <Text style={styles.mapPlaceholderCoords}>
              {business.location.latitude.toFixed(4)}, {business.location.longitude.toFixed(4)}
            </Text>
            <TouchableOpacity
              style={styles.googleMapsButton}
              onPress={() => openInGoogleMaps(
                business.location.latitude,
                business.location.longitude,
                business.name
              )}
            >
              <Text style={styles.googleMapsButtonText}>🗺️ View on Google Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opening Hours</Text>
          <Text style={styles.detailText}>{business.openingHours}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresContainer}>
            {business.features.map((feature, i) => (
              <Text key={i} style={styles.featureBadge}>{feature}</Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
          {ratingsLoading ? (
            <Text>Loading reviews...</Text>
          ) : ratings.length === 0 ? (
            <Text style={styles.detailText}>No reviews yet.</Text>
          ) : (
            ratings.map((review, i) => (
              <View key={i} style={styles.reviewCard}>
                <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
                {review.review ? <Text style={styles.reviewText}>{review.review}</Text> : null}
              </View>
            ))
          )}
          {hasNextPage && (
            <TouchableOpacity onPress={() => fetchNextPage()} style={styles.loadMoreButton}>
              <Text style={styles.loadMoreText}>Load More Reviews</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          <View style={styles.comingSoonBox}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 40 },
  gallery: { height: 250, width },
  image: { width, height: 250 },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  category: { fontSize: 16, color: '#FF6B00', fontWeight: '500', marginBottom: 12 },
  description: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 16 },
  rating: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 16 },
  // Map placeholder styles
  mapPlaceholder: {
    height: 180,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderIcon: { fontSize: 32 },
  mapPlaceholderTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  mapPlaceholderCoords: { fontSize: 13, color: '#999' },
  googleMapsButton: {
    marginTop: 8,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  googleMapsButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  // Original map styles (kept for dev build re-enable)
  mapContainer: { height: 200, width: '100%', borderRadius: 12, overflow: 'hidden' },
  map: { flex: 1 },
  detailText: { fontSize: 16, color: '#333' },
  featuresContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, overflow: 'hidden', color: '#333' },
  comingSoonBox: { backgroundColor: '#FFF5EB', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FFE4CC' },
  comingSoonText: { color: '#FF6B00', fontWeight: 'bold', fontSize: 16 },
  reviewCard: { backgroundColor: '#FAFAFA', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  reviewRating: { fontWeight: 'bold', fontSize: 15, marginBottom: 4, color: '#111' },
  reviewText: { color: '#444', fontSize: 14, lineHeight: 20 },
  loadMoreButton: { padding: 10, alignItems: 'center', marginTop: 10 },
  loadMoreText: { color: '#FF6B00', fontWeight: 'bold' }
});