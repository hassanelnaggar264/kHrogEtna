import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Image } from 'expo-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Video as VideoIcon, ImageIcon, AlertCircle, RotateCcw, CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../store/useAuthStore';
import { createPlacePost } from '../services/postService';
import { doc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { MOCK_PLACES } from '../data/mockPlaces';

type RouteParams = { placeId?: string };

export default function UploadReelScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { placeId: paramPlaceId } = (route.params as RouteParams) || {};
  const { user } = useAuthStore();

  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [placesList, setPlacesList] = useState<{ id: string; name: string }[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState(paramPlaceId || '');

  // Media state
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null);
  
  // Upload statuses
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Input states
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // 1. Guard check
    if (!user) {
      Alert.alert('Access Denied', 'Please log in to upload posts.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }

    if (user.accountType !== 'business') {
      Alert.alert('Access Denied', 'Only business accounts can upload Reels/Posts.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }

    // 2. Fetch owned places for selection
    const loadPlaces = async () => {
      try {
        const list: { id: string; name: string }[] = [];
        
        // Try Firestore
        const businessRef = collection(db, 'businesses');
        const q = query(businessRef, where('ownerId', '==', user.userId));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, name: docSnap.data().name });
        });

        // Fallback: merge with mock places if they have same ownerId pattern, or match all mock places to facilitate testing
        if (list.length === 0) {
          MOCK_PLACES.forEach(place => {
            list.push({ id: place.businessId, name: place.name });
          });
        }

        setPlacesList(list);
        
        // Auto select first if not set
        if (!selectedPlaceId && list.length > 0) {
          setSelectedPlaceId(list[0].id);
        }
      } catch (err) {
        console.error("Error loading business places:", err);
        // Direct mock load fallback
        const list = MOCK_PLACES.map(p => ({ id: p.businessId, name: p.name }));
        setPlacesList(list);
        if (!selectedPlaceId && list.length > 0) {
          setSelectedPlaceId(list[0].id);
        }
      } finally {
        setLoadingPlaces(false);
      }
    };

    loadPlaces();
  }, [user, paramPlaceId]);

  // --- Picker Handler ---
  const handleSelectMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your library to upload content.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.7
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // 1. Verify Video duration (max 60s limit)
        if (asset.type === 'video' || asset.uri.endsWith('.mp4') || asset.uri.includes('video')) {
          if (asset.duration && asset.duration > 61000) { // allow a 1s buffer for precision
            Alert.alert('Limit Exceeded', 'Video duration cannot exceed 60 seconds.');
            return;
          }
          setMediaType('video');
        } else {
          setMediaType('image');
        }

        setMediaUri(asset.uri);
        setDownloadUrl(null);
        setUploadFailed(false);

        // Auto start upload
        triggerUpload(asset.uri, asset.type === 'video' ? 'video' : 'image');
      }
    } catch (err) {
      console.error("Error selecting media:", err);
    }
  };

  // --- Storage Upload Handler ---
  const triggerUpload = async (localUri: string, type: 'video' | 'image') => {
    if (!user) return;
    setUploading(true);
    setUploadFailed(false);
    setDownloadUrl(null);

    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const fileExtension = localUri.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
      const fileName = `reels/${user.userId}/${Date.now()}.${fileExtension}`;

      const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
      const { storage } = require('../services/firebaseConfig');

      const fileRef = ref(storage, fileName);
      await uploadBytes(fileRef, blob);
      const url = await getDownloadURL(fileRef);

      setDownloadUrl(url);
      setUploading(false);
    } catch (err) {
      console.error("Firebase storage upload failed:", err);
      setUploadFailed(true);
      setUploading(false);
    }
  };

  const handleRetryUpload = () => {
    if (mediaUri && mediaType) {
      triggerUpload(mediaUri, mediaType);
    }
  };

  const handlePublish = async () => {
    if (!user) return;

    if (!selectedPlaceId) {
      Alert.alert('Validation Error', 'Please select a place to link this post.');
      return;
    }

    if (!mediaUri) {
      Alert.alert('Validation Error', 'Please select a video or image to publish.');
      return;
    }

    if (uploading) {
      Alert.alert('Upload in Progress', 'Please wait for your file to finish uploading.');
      return;
    }

    if (uploadFailed || !downloadUrl) {
      Alert.alert(
        'Upload Failed',
        'We were unable to upload the media file to Firebase Storage. Please retry uploading.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry Upload', onPress: handleRetryUpload }
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      await createPlacePost({
        placeId: selectedPlaceId,
        authorBusinessId: user.userId,
        mediaType: mediaType!,
        mediaUrl: downloadUrl,
        caption: caption.trim()
      });

      Alert.alert('Success', 'Your Reel / Post has been published successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error("Error creating post:", err);
      Alert.alert('Save Failed', 'Could not save the post details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Reel / Post</Text>
        <TouchableOpacity 
          style={[styles.publishBtn, (submitting || uploading || !mediaUri) && styles.publishBtnDisabled]}
          onPress={handlePublish}
          disabled={submitting || uploading || !mediaUri}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.publishBtnText}>Publish</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Link to Business Place */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Link to Place *</Text>
          {loadingPlaces ? (
            <ActivityIndicator size="small" color="#FF6B00" style={{ alignSelf: 'flex-start' }} />
          ) : (
            <View style={styles.pickerContainer}>
              {placesList.map((place) => (
                <TouchableOpacity 
                  key={place.id} 
                  style={[
                    styles.pickerItem, 
                    selectedPlaceId === place.id && styles.pickerItemActive
                  ]}
                  onPress={() => setSelectedPlaceId(place.id)}
                  disabled={!!paramPlaceId} // Prevent change if locked from page
                >
                  <Text style={[
                    styles.pickerItemText, 
                    selectedPlaceId === place.id && styles.pickerItemTextActive
                  ]}>
                    {place.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {paramPlaceId && (
            <Text style={styles.lockedHint}>Locked to current place profile.</Text>
          )}
        </View>

        {/* Media Selector & Preview */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Select Media *</Text>
          <Text style={styles.mediaHint}>Choose a video (maximum 60 seconds duration) or a promotional image.</Text>

          {!mediaUri ? (
            <TouchableOpacity style={styles.pickerButton} onPress={handleSelectMedia}>
              <VideoIcon size={32} color="#FF6B00" />
              <Text style={styles.pickerButtonText}>Choose Video / Photo</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.previewContainer}>
              {mediaType === 'image' ? (
                <Image source={{ uri: mediaUri }} style={styles.previewMedia} contentFit="cover" />
              ) : (
                <View style={styles.videoPlaceholder}>
                  <VideoIcon size={48} color="#FF6B00" />
                  <Text style={styles.videoPlaceholderText}>Video Selected (Ready)</Text>
                  <Text style={styles.videoPlaceholderUri} numberOfLines={1}>{mediaUri}</Text>
                </View>
              )}

              {/* Status Indicator */}
              <View style={styles.statusRow}>
                {uploading && (
                  <View style={styles.statusBadge}>
                    <ActivityIndicator size="small" color="#FF6B00" />
                    <Text style={styles.statusText}>Uploading file to storage...</Text>
                  </View>
                )}

                {downloadUrl && (
                  <View style={[styles.statusBadge, styles.statusSuccess]}>
                    <CheckCircle size={16} color="#4CD964" />
                    <Text style={[styles.statusText, styles.statusSuccessText]}>Ready to publish</Text>
                  </View>
                )}

                {uploadFailed && (
                  <View style={[styles.statusBadge, styles.statusFailed]}>
                    <AlertCircle size={16} color="#FF3B30" />
                    <Text style={[styles.statusText, styles.statusFailedText]}>Upload failed</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={handleRetryUpload}>
                      <RotateCcw size={14} color="#FFF" />
                      <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.changeMediaBtn} onPress={handleSelectMedia} disabled={uploading}>
                <Text style={styles.changeMediaBtnText}>Change Media File</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Caption */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Caption (Optional)</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption... (e.g. Taste the new menu item now!)"
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
            value={caption}
            onChangeText={setCaption}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  publishBtn: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  publishBtnDisabled: { backgroundColor: '#FFB580' },
  publishBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  scrollContent: { padding: 20 },

  formSection: { marginBottom: 28 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  mediaHint: { fontSize: 12, color: '#666', lineHeight: 18, marginBottom: 12 },
  
  // Picker Container
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pickerItem: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8
  },
  pickerItemActive: {
    borderColor: '#FF6B00',
    backgroundColor: '#FFF5EB'
  },
  pickerItemText: { fontSize: 13, color: '#666', fontWeight: '500' },
  pickerItemTextActive: { color: '#FF6B00', fontWeight: 'bold' },
  lockedHint: { fontSize: 11, color: '#FF6B00', marginTop: 6, fontWeight: '500' },

  // Select Buttons
  pickerButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CCC',
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10
  },
  pickerButtonText: { color: '#666', fontSize: 14, fontWeight: 'bold' },

  // Preview Media
  previewContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 12,
    alignItems: 'center'
  },
  previewMedia: { width: '100%', height: 200, borderRadius: 12 },
  videoPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  videoPlaceholderText: { fontSize: 14, fontWeight: 'bold', color: '#111' },
  videoPlaceholderUri: { fontSize: 11, color: '#888', maxWidth: '80%' },

  // Status Indicator
  statusRow: { width: '100%', marginTop: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    justifyContent: 'center'
  },
  statusSuccess: { backgroundColor: '#E8FDF0', borderWidth: 1, borderColor: '#D0F8DD' },
  statusSuccessText: { color: '#27AE60', fontWeight: 'bold' },
  statusFailed: { backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: '#FFE0E0' },
  statusFailedText: { color: '#EB5757', fontWeight: 'bold', flex: 1 },
  statusText: { fontSize: 13, color: '#666' },

  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  retryBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  changeMediaBtn: { marginTop: 12, paddingVertical: 8 },
  changeMediaBtnText: { color: '#FF6B00', fontWeight: 'bold', fontSize: 13 },

  captionInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#111',
    textAlignVertical: 'top',
    height: 90
  }
});
