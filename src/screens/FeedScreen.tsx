import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MapPin, Play, MessageCircle, Heart, Share2, Plus } from 'lucide-react-native';
import { Image } from 'expo-image';
import { getAllPosts } from '../services/postService';
import { PlacePost } from '../types/schema';
import { MOCK_PLACES } from '../data/mockPlaces';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuthStore } from '../store/useAuthStore';

const { width, height } = Dimensions.get('window');

// Height adjustment: take full screen minus headers/tabs
const feedHeight = height - (Platform.OS === 'ios' ? 140 : 110);

export default function FeedScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PlacePost[]>([]);
  const [activePlayIndex, setActivePlayIndex] = useState<number | null>(0);

  // Likes tracking (local simulator)
  const [likesMap, setLikesMap] = useState<Record<string, { count: number; liked: boolean }>>({});

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetched = await getAllPosts();
      setPosts(fetched);

      // Populate simulation likes
      const initialLikes: Record<string, { count: number; liked: boolean }> = {};
      fetched.forEach(post => {
        initialLikes[post.postId] = {
          count: Math.floor(Math.random() * 100) + 12,
          liked: false
        };
      });
      setLikesMap(initialLikes);
    } catch (err) {
      console.error("Error loading feed posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchPosts();
    });

    return unsubscribe;
  }, [navigation]);

  // Viewport tracking for autoplay
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActivePlayIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80
  }).current;

  const handleVisitPlace = async (placeId: string) => {
    try {
      const placeRef = doc(db, 'businesses', placeId);
      const snap = await getDoc(placeRef);
      if (snap.exists()) {
        navigation.navigate('PlaceDetails', { business: snap.data() });
      } else {
        const matched = MOCK_PLACES.find(p => p.businessId === placeId);
        if (matched) {
          const biz = {
            businessId: matched.businessId,
            name: matched.name,
            category: matched.category,
            description: matched.description,
            moods: matched.moods,
            priceRange: matched.priceRange,
            ratingAvg: matched.ratingAvg,
            ratingCount: matched.ratingCount,
            images: matched.images,
            openingHours: matched.openingHours,
            features: matched.features,
            ownerId: matched.ownerId,
          };
          navigation.navigate('PlaceDetails', { business: biz });
        }
      }
    } catch (err) {
      console.error("Error loading place details from feed:", err);
    }
  };

  const handleToggleLike = (postId: string) => {
    setLikesMap(prev => {
      const current = prev[postId] || { count: 12, liked: false };
      return {
        ...prev,
        [postId]: {
          count: current.liked ? current.count - 1 : current.count + 1,
          liked: !current.liked
        }
      };
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </SafeAreaView>
    );
  }

  if (posts.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.emptyText}>No Reels or Posts published yet.</Text>
        {user?.accountType === 'business' && (
          <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('UploadReel')}>
            <Text style={styles.createBtnText}>Upload First Reel</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>2Where? Reels</Text>
        {user?.accountType === 'business' && (
          <TouchableOpacity 
            style={styles.headerUploadBtn} 
            onPress={() => navigation.navigate('UploadReel')}
          >
            <Plus size={18} color="#FF6B00" />
            <Text style={styles.headerUploadText}>Post</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.postId}
        snapToInterval={feedHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => {
          const isPlaying = isFocused && index === activePlayIndex;
          const matchedPlace = MOCK_PLACES.find(p => p.businessId === item.placeId);
          const placeName = matchedPlace ? matchedPlace.name : 'Outing Place';
          const placeCategory = matchedPlace ? matchedPlace.category : 'Outing';
          const likesInfo = likesMap[item.postId] || { count: 48, liked: false };

          return (
            <View style={styles.itemContainer}>
              {item.mediaType === 'video' ? (
                <Video
                  source={{ uri: item.mediaUrl }}
                  style={styles.mediaVideo}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={isPlaying}
                  isLooping
                  useNativeControls={false}
                />
              ) : (
                <Image 
                  source={{ uri: item.mediaUrl }} 
                  style={styles.mediaVideo} 
                  contentFit="cover" 
                />
              )}

              {/* Top Dark Overlay */}
              <View style={styles.topGradient} />

              {/* Bottom Dark Overlay */}
              <View style={styles.bottomGradient} />

              {/* Pause Overlay Indicator */}
              {!isPlaying && item.mediaType === 'video' && (
                <View style={styles.pauseOverlay}>
                  <Play size={44} color="#FFF" fill="#FFF" style={{ opacity: 0.6 }} />
                </View>
              )}

              {/* Content Overlay Container */}
              <View style={styles.contentOverlay}>
                
                {/* Bottom details */}
                <View style={styles.bottomInfo}>
                  <TouchableOpacity 
                    style={styles.placePill} 
                    onPress={() => handleVisitPlace(item.placeId)}
                  >
                    <MapPin size={14} color="#FFF" />
                    <Text style={styles.placePillText}>{placeName} • {placeCategory}</Text>
                  </TouchableOpacity>
                  {item.caption ? (
                    <Text style={styles.captionText} numberOfLines={3}>{item.caption}</Text>
                  ) : null}
                </View>

                {/* Right actions */}
                <View style={styles.rightSidebar}>
                  
                  {/* Like */}
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleLike(item.postId)}>
                    <Heart 
                      size={28} 
                      color={likesInfo.liked ? '#FF2D55' : '#FFF'} 
                      fill={likesInfo.liked ? '#FF2D55' : 'transparent'} 
                    />
                    <Text style={styles.actionText}>{likesInfo.count}</Text>
                  </TouchableOpacity>

                  {/* Comment Simulation */}
                  <TouchableOpacity style={styles.actionBtn}>
                    <MessageCircle size={28} color="#FFF" />
                    <Text style={styles.actionText}>12</Text>
                  </TouchableOpacity>

                  {/* Share Simulation */}
                  <TouchableOpacity style={styles.actionBtn}>
                    <Share2 size={28} color="#FFF" />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  headerUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FF6B00',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#111'
  },
  headerUploadText: { color: '#FF6B00', fontSize: 12, fontWeight: 'bold' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FAFAFA' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  emptyText: { color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  createBtn: { backgroundColor: '#FF6B00', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  createBtnText: { color: '#FFF', fontWeight: 'bold' },

  // List Item Styles
  itemContainer: {
    width: width,
    height: feedHeight,
    backgroundColor: '#000',
    position: 'relative'
  },
  mediaVideo: {
    width: '100%',
    height: '100%'
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  pauseOverlay: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center'
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  bottomInfo: {
    flex: 1,
    marginRight: 60,
    alignItems: 'flex-start',
    gap: 10
  },
  placePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,0,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4
  },
  placePillText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  captionText: { color: '#EEE', fontSize: 14, lineHeight: 20, textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },

  rightSidebar: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 4
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { color: '#FFF', fontSize: 12, fontWeight: '600' }
});
