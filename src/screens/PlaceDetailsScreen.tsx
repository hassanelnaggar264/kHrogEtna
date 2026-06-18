import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Linking, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MapPin, Clock, Star, Navigation, Wifi, Sparkles, Flame, Play, HelpCircle, Flag, X, Plus, RotateCcw } from 'lucide-react-native';
import { Business, PlaceMenu, Rating } from '../types/schema';
import { MOCK_PLACES } from '../data/mockPlaces';
import { getPlaceMenu } from '../services/menuService';
import { useAuthStore } from '../store/useAuthStore';
import { getPlaceReviews, savePlaceReviewTransaction, submitContentReport, checkReviewRateLimit } from '../services/ratingService';
import * as ImagePicker from 'expo-image-picker';
import { Timestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');

type RouteParams = { business: Business };

type TabType = 'Overview' | 'Menu' | 'Reviews' | 'Media' | 'Reels';

export default function PlaceDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  
  // Extract business from route params
  const business: Business = (route.params as RouteParams)?.business;

  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const { user } = useAuthStore();
  
  // Menu tab state
  const [menu, setMenu] = useState<PlaceMenu | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Reviews tab state
  const [reviewsList, setReviewsList] = useState<Rating[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  // Review Modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [userReviewId, setUserReviewId] = useState<string | undefined>(undefined);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Media attachments in Review Modal
  const [attachedMedia, setAttachedMedia] = useState<{
    localUri: string;
    uploading: boolean;
    failed: boolean;
    downloadUrl: string | null;
  }[]>([]);

  const fetchMenuAndReviews = async () => {
    if (!business?.businessId) return;
    
    // Fetch menu
    try {
      setLoadingMenu(true);
      const fetchedMenu = await getPlaceMenu(business.businessId);
      setMenu(fetchedMenu);
    } catch (err) {
      console.error("Error loading menu:", err);
    } finally {
      setLoadingMenu(false);
    }

    // Fetch reviews
    try {
      setLoadingReviews(true);
      const fetchedReviews = await getPlaceReviews(business.businessId);
      setReviewsList(fetchedReviews);
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (active) {
      fetchMenuAndReviews();
    }

    const unsubscribe = navigation.addListener('focus', () => {
      fetchMenuAndReviews();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigation, business?.businessId]);

  const userExistingReview = user ? reviewsList.find(r => r.userId === user.userId) : null;

  const visibleReviews = reviewsList.filter(rev => !reportedIds.includes(rev.ratingId));
  const totalReviewsCount = visibleReviews.length;
  
  const ratingDistribution: Record<1|2|3|4|5, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  visibleReviews.forEach(rev => {
    const rounded = Math.round(rev.rating) as 1 | 2 | 3 | 4 | 5;
    if (ratingDistribution[rounded] !== undefined) {
      ratingDistribution[rounded]++;
    }
  });

  const getProgressWidth = (stars: number) => {
    if (totalReviewsCount === 0) return '0%';
    const count = ratingDistribution[stars as 1|2|3|4|5] || 0;
    return `${(count / totalReviewsCount) * 100}%`;
  };

  const dynamicAvgRating = totalReviewsCount > 0
    ? visibleReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount
    : business.ratingAvg || 0;

  const triggerUpload = async (localUri: string) => {
    if (!user) return;
    
    setAttachedMedia(prev => prev.map(item => 
      item.localUri === localUri ? { ...item, uploading: true, failed: false } : item
    ));

    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const fileExtension = localUri.split('.').pop() || 'jpg';
      const fileName = `reviews/${user.userId}/${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExtension}`;
      
      const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
      const { storage } = require('../services/firebaseConfig');
      
      const fileRef = ref(storage, fileName);
      await uploadBytes(fileRef, blob);
      const downloadUrl = await getDownloadURL(fileRef);

      setAttachedMedia(prev => prev.map(item => 
        item.localUri === localUri ? { ...item, uploading: false, failed: false, downloadUrl } : item
      ));
    } catch (err) {
      console.error(`Upload failed for ${localUri}:`, err);
      setAttachedMedia(prev => prev.map(item => 
        item.localUri === localUri ? { ...item, uploading: false, failed: true } : item
      ));
    }
  };

  const handleSelectMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to attach them to reviews.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newItems = result.assets.map(asset => ({
          localUri: asset.uri,
          uploading: false,
          failed: false,
          downloadUrl: null
        }));

        setAttachedMedia(prev => {
          const updated = [...prev, ...newItems];
          newItems.forEach(item => {
            triggerUpload(item.localUri);
          });
          return updated;
        });
      }
    } catch (err) {
      console.error("Error selecting media:", err);
    }
  };

  const handleRetryUpload = (localUri: string) => {
    triggerUpload(localUri);
  };

  const handleRemoveMedia = (localUri: string) => {
    setAttachedMedia(prev => prev.filter(item => item.localUri !== localUri));
  };

  const handleOpenReviewModal = () => {
    if (!user) {
      Alert.alert('Login Required', 'You need to be logged in to review this place.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }
    
    if (user.accountType === 'business') {
      Alert.alert('Business Account', 'Business accounts cannot write reviews.');
      return;
    }

    if (userExistingReview) {
      setReviewRating(userExistingReview.rating);
      setReviewText(userExistingReview.review);
      setUserReviewId(userExistingReview.ratingId);
      if (userExistingReview.photos) {
        setAttachedMedia(userExistingReview.photos.map(url => ({
          localUri: url,
          uploading: false,
          failed: false,
          downloadUrl: url
        })));
      } else {
        setAttachedMedia([]);
      }
    } else {
      setReviewRating(0);
      setReviewText('');
      setUserReviewId(undefined);
      setAttachedMedia([]);
    }
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!user) return;
    
    const text = reviewText.trim();
    if (!text) {
      Alert.alert('Validation Error', 'Review content cannot be empty.');
      return;
    }

    if (reviewRating === 0) {
      Alert.alert('Validation Error', 'Please select a star rating.');
      return;
    }

    const isUploading = attachedMedia.some(m => m.uploading);
    if (isUploading) {
      Alert.alert('Upload in Progress', 'Please wait for your files to finish uploading.');
      return;
    }

    const hasFailed = attachedMedia.some(m => m.failed);
    if (hasFailed) {
      Alert.alert(
        'Failed Uploads',
        'Some files failed to upload. You can retry them, or submit the review without them.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit Without Failed Files', onPress: () => proceedSubmit() }
        ]
      );
      return;
    }

    await proceedSubmit();
  };

  const proceedSubmit = async () => {
    if (!user) return;
    
    setSubmittingReview(true);
    try {
      if (!userReviewId) {
        const rateLimit = await checkReviewRateLimit(user.userId);
        if (!rateLimit.allowed) {
          Alert.alert('Rate Limit Exceeded', 'You can submit a maximum of 3 reviews per hour. Please try again later.');
          setSubmittingReview(false);
          return;
        }
      }

      const photoUrls = attachedMedia
        .filter(m => m.downloadUrl !== null)
        .map(m => m.downloadUrl!);

      await savePlaceReviewTransaction({
        businessId: business.businessId,
        userId: user.userId,
        ratingValue: reviewRating,
        reviewText: reviewText.trim(),
        photoUris: photoUrls,
        existingRatingId: userReviewId
      });

      Alert.alert('Success', 'Your review has been saved successfully!');
      setReviewModalVisible(false);
      fetchMenuAndReviews();
    } catch (err) {
      console.error("Error saving review:", err);
      Alert.alert('Error', 'Failed to save review. Please check your connection.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReportReview = (review: Rating) => {
    if (!user) {
      Alert.alert('Login Required', 'You need to be logged in to report content.');
      return;
    }

    Alert.alert(
      'Report Review',
      'Choose a reason for reporting this review:',
      [
        { text: 'Spam', onPress: () => submitReport(review.ratingId, 'Spam') },
        { text: 'Inappropriate Content', onPress: () => submitReport(review.ratingId, 'Inappropriate') },
        { text: 'Harassment', onPress: () => submitReport(review.ratingId, 'Harassment') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const submitReport = async (reviewId: string, reason: string) => {
    if (!user) return;
    try {
      await submitContentReport(user.userId, 'review', reviewId, reason);
      Alert.alert('Report Submitted', 'Thank you. We will review this review shortly.');
      setReportedIds(prev => [...prev, reviewId]);
    } catch (err) {
      console.error("Error submitting report:", err);
    }
  };

  const isOwner = user?.accountType === 'business' && (
    user.userId === business.ownerId || 
    business.ownerId === `owner_${business.businessId.replace('place_', '')}` ||
    !business.ownerId
  );

  if (!business) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>No place details found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Find fully enriched mock details from local dataset
  const enrichedPlace = MOCK_PLACES.find(p => p.businessId === business.businessId);

  // Fallback values in case mock place is not found (for custom Firestore docs)
  const moods = business.moods || [];
  const priceRange = business.priceRange || '$$';
  const features = business.features || [];
  const images = business.images && business.images.length > 0 ? business.images : ['https://images.unsplash.com/photo-1554118811-1e0d58224f24'];
  const ratingAvg = business.ratingAvg || 4.5;
  const ratingCount = business.ratingCount || 10;
  const openingHours = business.openingHours || '09:00 AM - 11:00 PM';
  const description = business.description || 'No description available.';

  // Structured reviews from enriched place, or fallbacks
  const reviewItems = enrichedPlace?.reviews || [
    { author: 'Guest User', rating: 5, review: 'Amazing atmosphere and super friendly staff. Highly recommended!', date: '2026-06-14' }
  ];

  const locationCoords = business.location 
    ? { latitude: business.location.latitude, longitude: business.location.longitude }
    : { latitude: 30.0444, longitude: 31.2357 }; // default Cairo coordinates

  const openDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${locationCoords.latitude},${locationCoords.longitude}`;
    Linking.openURL(url).catch(err => console.error("An error occurred opening Google Maps Directions", err));
  };

  const tabs: TabType[] = ['Overview', 'Menu', 'Reviews', 'Media', 'Reels'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBarButton} onPress={() => navigation.goBack()}>
          <Text style={styles.navBarButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.navBarTitle} numberOfLines={1}>{business.name}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Gallery Slider (Displays top place images) */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {images.map((imgUri, index) => (
            <Image
              key={index}
              source={{ uri: imgUri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ))}
        </ScrollView>

        {/* Place Header Info */}
        <View style={styles.header}>
          <Text style={styles.title}>{business.name}</Text>
          <Text style={styles.category}>{business.category} • {priceRange}</Text>
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <Text style={styles.ratingBadgeText}>{ratingAvg.toFixed(1)}</Text>
            </View>
            <Text style={styles.ratingCountText}>({ratingCount} reviews)</Text>
          </View>
        </View>

        {/* Custom Segmented Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Tab Content Area */}
        <View style={styles.tabContentArea}>
          
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'Overview' && (
            <View>
              <Text style={styles.overviewDesc}>{description}</Text>

              {/* Map Preview & Directions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location & Directions</Text>
                
                <View style={styles.mapContainer}>
                  <Image
                    source={{ 
                      uri: `https://static-maps.yandex.ru/1.x/?ll=${locationCoords.longitude},${locationCoords.latitude}&z=15&l=map&size=600,300&pt=${locationCoords.longitude},${locationCoords.latitude},pm2orgm` 
                    }}
                    style={styles.staticMapImage}
                    contentFit="cover"
                  />
                  <View style={styles.mapPinOverlay}>
                    <Text style={styles.mapPinLabel} numberOfLines={1}>{business.name}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
                  <Navigation size={18} color="#FFF" />
                  <Text style={styles.directionsButtonText}>Get Directions</Text>
                </TouchableOpacity>
              </View>

              {/* Attributes / Features list */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attributes & Features</Text>
                <View style={styles.featuresContainer}>
                  {features.map((feature, i) => (
                    <View key={i} style={styles.featureBadge}>
                      {feature.toLowerCase().includes('wifi') && <Wifi size={14} color="#666" style={{ marginRight: 4 }} />}
                      {feature.toLowerCase().includes('quiet') && <Sparkles size={14} color="#666" style={{ marginRight: 4 }} />}
                      {feature.toLowerCase().includes('smoke') && <Flame size={14} color="#666" style={{ marginRight: 4 }} />}
                      <Text style={styles.featureBadgeText}>{feature}</Text>
                    </View>
                  ))}
                  {features.length === 0 && (
                    <Text style={styles.emptyTabText}>No specific attributes documented.</Text>
                  )}
                </View>
              </View>

              {/* Details & Timings */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.detailRow}>
                  <Clock size={16} color="#666" style={{ marginRight: 8 }} />
                  <Text style={styles.detailText}>{openingHours}</Text>
                </View>
                <View style={styles.detailRow}>
                  <HelpCircle size={16} color="#666" style={{ marginRight: 8 }} />
                  <Text style={styles.detailText}>Price Range: {priceRange} (Out of $$$$$)</Text>
                </View>
              </View>
            </View>
          )}

          {/* 2. MENU TAB */}
          {activeTab === 'Menu' && (
            <View style={styles.menuTab}>
              <View style={styles.menuTabHeader}>
                <Text style={styles.tabHeaderTitle}>Outing Menu</Text>
                {isOwner && (
                  <TouchableOpacity 
                    style={styles.editMenuBtn} 
                    onPress={() => navigation.navigate('MenuEditor', { businessId: business.businessId })}
                  >
                    <Text style={styles.editMenuBtnText}>⚙️ Edit Menu</Text>
                  </TouchableOpacity>
                )}
              </View>

              {loadingMenu ? (
                <View style={styles.menuLoadingContainer}>
                  <ActivityIndicator size="small" color="#FF6B00" />
                  <Text style={styles.menuLoadingText}>Loading menu...</Text>
                </View>
              ) : !menu || (menu.sections.length === 0 && (!menu.menuPhotos || menu.menuPhotos.length === 0)) ? (
                <Text style={styles.emptyTabText}>No menu items or photos available yet.</Text>
              ) : (
                <View style={{ gap: 20 }}>
                  {menu.sections.map((section) => (
                    <View key={section.sectionId} style={styles.sectionGroup}>
                      <Text style={styles.menuSectionHeader}>{section.title}</Text>
                      {section.items.map((item) => (
                        <View key={item.itemId} style={styles.menuItemCard}>
                          <View style={styles.menuItemRow}>
                            {item.photo ? (
                              <Image 
                                source={{ uri: item.photo }} 
                                style={styles.menuItemPhoto} 
                                contentFit="cover" 
                              />
                            ) : null}
                            <View style={styles.menuItemContent}>
                              <View style={styles.menuItemHeader}>
                                <Text style={styles.menuItemName}>{item.name}</Text>
                                <Text style={styles.menuItemPrice}>{item.price} {item.currency || 'EGP'}</Text>
                              </View>
                              {item.nameEn ? (
                                <Text style={styles.menuItemNameEn}>{item.nameEn}</Text>
                              ) : null}
                              {item.description ? (
                                <Text style={styles.menuItemDesc}>{item.description}</Text>
                              ) : null}
                              {item.tags && item.tags.length > 0 ? (
                                <View style={styles.menuItemTagsRow}>
                                  {item.tags.map((tag, tIdx) => (
                                    <View key={tIdx} style={styles.menuItemTagBadge}>
                                      <Text style={styles.menuItemTagText}>{tag}</Text>
                                    </View>
                                  ))}
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}

                  {/* Optional Menu Photos Gallery */}
                  {menu.menuPhotos && menu.menuPhotos.length > 0 && (
                    <View style={styles.menuPhotosSection}>
                      <Text style={styles.menuPhotosTitle}>Menu Photos</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuPhotosScroll}>
                        {menu.menuPhotos.map((photoUrl, pIdx) => (
                          <View key={pIdx} style={styles.menuPhotoContainer}>
                            <Image 
                              source={{ uri: photoUrl }} 
                              style={styles.menuPhotoAttachment} 
                              contentFit="cover" 
                            />
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* 3. REVIEWS TAB */}
          {activeTab === 'Reviews' && (
            <View style={styles.reviewsTab}>
              <View style={styles.reviewsTabHeader}>
                <Text style={styles.tabHeaderTitle}>Visitor Feedback</Text>
                {(!user || user.accountType === 'personal') && (
                  <TouchableOpacity style={styles.writeReviewBtn} onPress={handleOpenReviewModal}>
                    <Text style={styles.writeReviewBtnText}>
                      {userExistingReview ? '✍️ Edit Your Review' : '✍️ Write a Review'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Rating Distribution calculation */}
              {loadingReviews ? (
                <View style={styles.menuLoadingContainer}>
                  <ActivityIndicator size="small" color="#FF6B00" />
                  <Text style={styles.menuLoadingText}>Loading reviews...</Text>
                </View>
              ) : (
                <View>
                  <View style={styles.ratingSummaryBox}>
                    <View style={styles.summaryLeft}>
                      <Text style={styles.summaryRatingVal}>{dynamicAvgRating.toFixed(1)}</Text>
                      <View style={styles.starsRow}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star 
                            key={idx} 
                            size={14} 
                            color="#FFD700" 
                            fill={idx < Math.round(dynamicAvgRating) ? '#FFD700' : 'transparent'} 
                          />
                        ))}
                      </View>
                      <Text style={styles.summaryReviewsCount}>{totalReviewsCount} reviews</Text>
                    </View>

                    <View style={styles.summaryRight}>
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <View key={stars} style={styles.progressBarRow}>
                          <Text style={styles.progressLabel}>{stars} ★</Text>
                          <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: getProgressWidth(stars) as any }]} />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Review Cards list */}
                  {reviewsList.filter(rev => !reportedIds.includes(rev.ratingId)).length === 0 ? (
                    <Text style={styles.emptyTabText}>No visitor feedback written yet.</Text>
                  ) : (
                    reviewsList.filter(rev => !reportedIds.includes(rev.ratingId)).map((review, i) => {
                      const dateStr = review.createdAt 
                        ? (review.createdAt instanceof Timestamp 
                            ? review.createdAt.toDate().toLocaleDateString()
                            : new Date(review.createdAt).toLocaleDateString())
                        : 'Recent';

                      const authorName = (review as any).authorName || (review.userId === user?.userId ? 'You' : 'Visitor');
                      
                      return (
                        <View key={review.ratingId || i} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.reviewAuthor}>{authorName}</Text>
                                {user && user.userId !== review.userId && (
                                  <TouchableOpacity onPress={() => handleReportReview(review)} style={styles.reportBtn}>
                                    <Flag size={14} color="#999" />
                                  </TouchableOpacity>
                                )}
                              </View>
                              <Text style={styles.reviewDate}>{dateStr}</Text>
                            </View>
                            <View style={styles.reviewStars}>
                              {Array.from({ length: 5 }).map((_, starIdx) => (
                                <Star 
                                  key={starIdx} 
                                  size={12} 
                                  color="#FFD700" 
                                  fill={starIdx < review.rating ? '#FFD700' : 'transparent'} 
                                />
                              ))}
                            </View>
                          </View>
                          <Text style={styles.reviewBody}>{review.review}</Text>
                          
                          {/* Attached Media List */}
                          {review.photos && review.photos.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 10 }}>
                              {review.photos.map((photoUrl, pIdx) => (
                                <Image 
                                  key={pIdx} 
                                  source={{ uri: photoUrl }} 
                                  style={styles.reviewAttachedPhoto} 
                                  contentFit="cover" 
                                />
                              ))}
                            </ScrollView>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          )}

          {/* 4. MEDIA TAB */}
          {activeTab === 'Media' && (
            <View style={styles.mediaTab}>
              <Text style={styles.tabHeaderTitle}>Photos Grid</Text>
              <View style={styles.mediaGrid}>
                {images.concat([
                  'https://images.unsplash.com/photo-1559925393-8be0ec41b50d?w=400',
                  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
                  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
                  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'
                ]).slice(0, 6).map((imgUri, index) => (
                  <Image
                    key={index}
                    source={{ uri: imgUri }}
                    style={styles.gridImage}
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 5. REELS TAB */}
          {activeTab === 'Reels' && (
            <View style={styles.reelsTab}>
              <Text style={styles.tabHeaderTitle}>Visitor Reels</Text>
              <View style={styles.reelsGrid}>
                {[
                  { views: '12.5k', title: 'Weekend Vibe! ☕', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24' },
                  { views: '4.8k', title: 'Must Try Dessert', img: 'https://images.unsplash.com/photo-1559925393-8be0ec41b50d' },
                  { views: '28.1k', title: 'Rooftop DJ night', img: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7' },
                  { views: '8.2k', title: 'Study Session Vibe', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085' }
                ].map((reel, index) => (
                  <View key={index} style={styles.reelCard}>
                    <Image
                      source={{ uri: reel.img }}
                      style={styles.reelImage}
                      contentFit="cover"
                    />
                    <View style={styles.reelOverlay}>
                      <View style={styles.playIconContainer}>
                        <Play size={18} color="#FFF" fill="#FFF" />
                      </View>
                      <Text style={styles.reelViews}>{reel.views} views</Text>
                    </View>
                    <Text style={styles.reelTitle} numberOfLines={1}>{reel.title}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Review Write/Edit Modal */}
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{userReviewId ? 'Edit Your Review' : 'Write a Review'}</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <X size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
              
              {/* Star Rating Select */}
              <View style={styles.ratingSelectSection}>
                <Text style={styles.modalLabel}>Your Rating *</Text>
                <View style={styles.ratingStarsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                      <Star 
                        size={32} 
                        color="#FFD700" 
                        fill={star <= reviewRating ? '#FFD700' : 'transparent'} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Review Text */}
              <View style={styles.inputGroup}>
                <Text style={styles.modalLabel}>Review Details *</Text>
                <TextInput
                  style={[styles.modalInput, styles.textAreaInput]}
                  placeholder="Share your experience (e.g. food quality, vibes, service...)"
                  multiline
                  numberOfLines={4}
                  value={reviewText}
                  onChangeText={setReviewText}
                />
              </View>

              {/* UGC Media Attachments */}
              <View style={styles.mediaAttachmentSection}>
                <View style={styles.mediaHeaderRow}>
                  <Text style={styles.modalLabel}>Photos & Videos (Optional)</Text>
                  <TouchableOpacity style={styles.addMediaBtn} onPress={handleSelectMedia}>
                    <Plus size={16} color="#FF6B00" />
                    <Text style={styles.addMediaBtnText}>Attach Media</Text>
                  </TouchableOpacity>
                </View>

                {attachedMedia.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaThumbsScroll}>
                    {attachedMedia.map((item, idx) => (
                      <View key={idx} style={styles.mediaThumbWrapper}>
                        <Image source={{ uri: item.localUri }} style={styles.mediaThumb} contentFit="cover" />
                        
                        {item.uploading && (
                          <View style={styles.uploadOverlay}>
                            <ActivityIndicator size="small" color="#FFF" />
                          </View>
                        )}

                        {item.failed && (
                          <View style={styles.failedOverlay}>
                            <Text style={styles.failedText}>Failed</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={() => handleRetryUpload(item.localUri)}>
                              <RotateCcw size={12} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        )}

                        <TouchableOpacity style={styles.removeMediaBtn} onPress={() => handleRemoveMedia(item.localUri)}>
                          <X size={12} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noMediaText}>No photos or videos attached yet.</Text>
                )}
              </View>

            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setReviewModalVisible(false)} disabled={submittingReview}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  navBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: '#FFF' },
  navBarButton: { paddingVertical: 8, paddingHorizontal: 12 },
  navBarButtonText: { fontSize: 16, color: '#FF6B00', fontWeight: 'bold' },
  navBarTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', flex: 1, textAlign: 'center' },
  
  scrollContent: { paddingBottom: 40 },
  gallery: { height: 240, width },
  image: { width, height: 240 },
  
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  category: { fontSize: 15, color: '#FF6B00', fontWeight: '600', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingBadge: { flexDirection: 'row', backgroundColor: '#FFF5EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#FFE4CC' },
  ratingBadgeText: { fontSize: 13, fontWeight: 'bold', color: '#111' },
  ratingCountText: { fontSize: 13, color: '#666' },

  // Tabs style
  tabContainer: { borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: '#FFF' },
  tabScrollContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  tabButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F5F5F5' },
  tabButtonActive: { backgroundColor: '#FF6B00' },
  tabButtonText: { fontSize: 14, color: '#666', fontWeight: 'bold' },
  tabButtonTextActive: { color: '#FFF' },

  tabContentArea: { padding: 20 },
  overviewDesc: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 20 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  
  // Static Map Container styles (prevent RNMapsAirModule crash)
  mapContainer: { height: 180, width: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE', position: 'relative' },
  staticMapImage: { width: '100%', height: '100%' },
  mapPinOverlay: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#EEE' },
  mapPinLabel: { fontSize: 12, fontWeight: 'bold', color: '#111', maxWidth: width - 80 },
  
  directionsButton: { flexDirection: 'row', backgroundColor: '#FF6B00', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  directionsButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  
  featuresContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureBadge: { flexDirection: 'row', backgroundColor: '#F5F5F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  featureBadgeText: { fontSize: 13, color: '#444', fontWeight: '500' },
  
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#444' },

  // Menu Tab styles
  menuTab: { gap: 12 },
  menuTabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editMenuBtn: { backgroundColor: '#FFF5EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FFE4CC' },
  editMenuBtnText: { color: '#FF6B00', fontWeight: 'bold', fontSize: 13 },
  menuLoadingContainer: { paddingVertical: 20, alignItems: 'center', gap: 8 },
  menuLoadingText: { color: '#666', fontSize: 13 },
  sectionGroup: { gap: 10 },
  menuSectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#111', marginTop: 10, marginBottom: 4 },
  menuItemRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  menuItemPhoto: { width: 70, height: 70, borderRadius: 8 },
  menuItemContent: { flex: 1, justifyContent: 'center' },
  menuItemNameEn: { fontSize: 12, color: '#999', fontStyle: 'italic', marginBottom: 4 },
  menuItemTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  menuItemTagBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  menuItemTagText: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  menuPhotosSection: { marginTop: 16 },
  menuPhotosTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 10 },
  menuPhotosScroll: { gap: 10 },
  menuPhotoContainer: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
  menuPhotoAttachment: { width: 140, height: 180 },
  tabHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  menuItemCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2 },
  menuItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  menuItemName: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  menuItemPrice: { fontSize: 16, fontWeight: 'bold', color: '#FF6B00' },
  menuItemDesc: { fontSize: 13, color: '#666', lineHeight: 18 },

  // Reviews Tab styles
  reviewsTab: { gap: 12 },
  reviewsTabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  writeReviewBtn: { backgroundColor: '#FF6B00', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  writeReviewBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  reportBtn: { padding: 4 },
  reviewAttachedPhoto: { width: 80, height: 80, borderRadius: 8 },
  ratingSummaryBox: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF5EB', borderRadius: 16, borderWidth: 1, borderColor: '#FFE4CC', marginBottom: 16 },
  summaryLeft: { flex: 1.2, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#FFE4CC', paddingRight: 12 },
  summaryRatingVal: { fontSize: 40, fontWeight: 'bold', color: '#111' },
  starsRow: { flexDirection: 'row', gap: 2, marginVertical: 4 },
  summaryReviewsCount: { fontSize: 12, color: '#666' },
  summaryRight: { flex: 2, paddingLeft: 12, justifyContent: 'center' },
  progressBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  progressLabel: { fontSize: 11, color: '#555', width: 22 },
  progressBarBackground: { flex: 1, height: 6, backgroundColor: '#EAEAEA', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: '#FF6B00', borderRadius: 3 },
  reviewCard: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  reviewAuthor: { fontSize: 14, fontWeight: 'bold', color: '#111' },
  reviewDate: { fontSize: 11, color: '#888', marginTop: 2 },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewBody: { fontSize: 13, color: '#444', lineHeight: 18 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 34, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  modalScrollContent: { padding: 16 },
  ratingSelectSection: { alignItems: 'center', marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  ratingStarsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  inputGroup: { marginBottom: 20 },
  modalInput: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EAEAEA', borderRadius: 8, padding: 12, fontSize: 14, color: '#111' },
  textAreaInput: { height: 100, textAlignVertical: 'top' },
  mediaAttachmentSection: { marginBottom: 20 },
  mediaHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addMediaBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#FF6B00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  addMediaBtnText: { color: '#FF6B00', fontSize: 12, fontWeight: '600' },
  mediaThumbsScroll: { flexDirection: 'row', gap: 10 },
  mediaThumbWrapper: { position: 'relative', marginRight: 10 },
  mediaThumb: { width: 80, height: 80, borderRadius: 8 },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  failedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,59,48,0.7)', justifyContent: 'center', alignItems: 'center', borderRadius: 8, gap: 4 },
  failedText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  retryBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 10 },
  removeMediaBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: 'rgba(0,0,0,0.6)', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  noMediaText: { fontSize: 12, color: '#999', fontStyle: 'italic', paddingVertical: 8 },
  modalActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  modalCancelBtn: { flex: 1, backgroundColor: '#F5F5F5', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EAEAEA' },
  modalCancelBtnText: { color: '#666', fontWeight: 'bold', fontSize: 15 },
  modalSubmitBtn: { flex: 1, backgroundColor: '#FF6B00', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalSubmitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // Media Tab styles
  mediaTab: {},
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  gridImage: { width: (width - 50) / 2, height: 120, borderRadius: 12 },

  // Reels Tab styles
  reelsTab: {},
  reelsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  reelCard: { width: (width - 50) / 2, height: 240, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', marginBottom: 10, position: 'relative' },
  reelImage: { width: '100%', height: '100%', opacity: 0.8 },
  reelOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  playIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  reelViews: { position: 'absolute', bottom: 12, left: 12, color: '#FFF', fontSize: 12, fontWeight: '600' },
  reelTitle: { position: 'absolute', bottom: 32, left: 12, right: 12, color: '#FFF', fontSize: 14, fontWeight: 'bold' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#FF3B30', fontWeight: '600' },
  backBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FF6B00', borderRadius: 8 },
  backBtnText: { color: '#FFF', fontWeight: 'bold' },
  emptyTabText: { color: '#888', fontSize: 13 }
});