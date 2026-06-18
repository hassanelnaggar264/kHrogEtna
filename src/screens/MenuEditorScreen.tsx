import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Image } from 'expo-image';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Trash2, Edit3, Save, X, Image as ImageIcon } from 'lucide-react-native';
import { getPlaceMenu, savePlaceMenu } from '../services/menuService';
import { PlaceMenu, MenuSection, MenuItem } from '../types/schema';

type RouteParams = { businessId: string };

export default function MenuEditorScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { businessId } = (route.params as RouteParams) || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<PlaceMenu | null>(null);

  // Modal State for Item editing
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  // State for adding a new photo URL attachment
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  useEffect(() => {
    if (!businessId) {
      Alert.alert('Error', 'No business ID provided.');
      navigation.goBack();
      return;
    }

    const loadMenu = async () => {
      try {
        const fetchedMenu = await getPlaceMenu(businessId);
        setMenu(fetchedMenu);
      } catch (err) {
        console.error('Error loading menu:', err);
        Alert.alert('Error', 'Failed to load menu details.');
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [businessId]);

  if (loading || !menu) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading menu editor...</Text>
      </SafeAreaView>
    );
  }

  // --- Section Actions ---
  const handleAddSection = () => {
    const newSection: MenuSection = {
      sectionId: `sec_${Date.now()}`,
      title: 'New Section',
      items: []
    };
    setMenu({
      ...menu,
      sections: [...menu.sections, newSection]
    });
  };

  const handleRenameSection = (sectionId: string, newTitle: string) => {
    setMenu({
      ...menu,
      sections: menu.sections.map(sec => 
        sec.sectionId === sectionId ? { ...sec, title: newTitle } : sec
      )
    });
  };

  const handleDeleteSection = (sectionId: string, title: string) => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete "${title}" and all its items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setMenu({
              ...menu,
              sections: menu.sections.filter(sec => sec.sectionId !== sectionId)
            });
          }
        }
      ]
    );
  };

  // --- Item Actions ---
  const handleOpenAddItem = (sectionId: string) => {
    setEditingSectionId(sectionId);
    setEditingItem({
      itemId: `item_${Date.now()}`,
      name: '',
      nameEn: '',
      price: 0,
      currency: 'EGP',
      description: '',
      tags: [],
      photo: ''
    });
    setIsNewItem(true);
    setItemModalVisible(true);
  };

  const handleOpenEditItem = (sectionId: string, item: MenuItem) => {
    setEditingSectionId(sectionId);
    setEditingItem({ ...item });
    setIsNewItem(false);
    setItemModalVisible(true);
  };

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    setMenu({
      ...menu,
      sections: menu.sections.map(sec => {
        if (sec.sectionId === sectionId) {
          return {
            ...sec,
            items: sec.items.filter(item => item.itemId !== itemId)
          };
        }
        return sec;
      })
    });
  };

  const handleSaveItemModal = () => {
    if (!editingItem || !editingSectionId) return;

    // Validation
    const name = editingItem.name?.trim() || '';
    if (!name) {
      Alert.alert('Validation Error', 'Item Name is required.');
      return;
    }

    const price = Number(editingItem.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Validation Error', 'Price must be a valid number greater than 0.');
      return;
    }

    const finalItem: MenuItem = {
      itemId: editingItem.itemId || `item_${Date.now()}`,
      name: name,
      nameEn: editingItem.nameEn?.trim() || undefined,
      price: price,
      currency: editingItem.currency || 'EGP',
      description: editingItem.description?.trim() || undefined,
      tags: editingItem.tags || [],
      photo: editingItem.photo?.trim() || undefined
    };

    setMenu({
      ...menu,
      sections: menu.sections.map(sec => {
        if (sec.sectionId === editingSectionId) {
          if (isNewItem) {
            return {
              ...sec,
              items: [...sec.items, finalItem]
            };
          } else {
            return {
              ...sec,
              items: sec.items.map(it => it.itemId === finalItem.itemId ? finalItem : it)
            };
          }
        }
        return sec;
      })
    });

    setItemModalVisible(false);
    setEditingItem(null);
    setEditingSectionId(null);
  };

  // --- Photo Attachment Actions ---
  const handleAddPhotoUrl = () => {
    const url = newPhotoUrl.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('Validation Error', 'Please enter a valid URL starting with http:// or https://');
      return;
    }

    const currentPhotos = menu.menuPhotos || [];
    setMenu({
      ...menu,
      menuPhotos: [...currentPhotos, url]
    });
    setNewPhotoUrl('');
  };

  const handleDeletePhotoUrl = (urlToDelete: string) => {
    const currentPhotos = menu.menuPhotos || [];
    setMenu({
      ...menu,
      menuPhotos: currentPhotos.filter(url => url !== urlToDelete)
    });
  };

  // --- Save Whole Menu Action ---
  const handleSaveMenu = async () => {
    // Validate that sections aren't empty of titles
    const hasEmptySectionTitle = menu.sections.some(sec => !sec.title.trim());
    if (hasEmptySectionTitle) {
      Alert.alert('Validation Error', 'All sections must have a title.');
      return;
    }

    setSaving(true);
    try {
      await savePlaceMenu(businessId, menu);
      Alert.alert('Success', 'Menu saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error('Error saving menu:', err);
      Alert.alert('Save Failed', 'Could not save the menu to database.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Structured Menu</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSaveMenu}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Save size={18} color="#FFF" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Sections Listing */}
        <View style={styles.sectionsContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionGroupTitle}>Menu Sections</Text>
            <TouchableOpacity style={styles.addSectionBtn} onPress={handleAddSection}>
              <Plus size={16} color="#FF6B00" />
              <Text style={styles.addSectionBtnText}>Add Section</Text>
            </TouchableOpacity>
          </View>

          {menu.sections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No menu sections created yet. Add a section to start building your menu!</Text>
            </View>
          ) : (
            menu.sections.map((sec) => (
              <View key={sec.sectionId} style={styles.sectionCard}>
                
                {/* Section header edit */}
                <View style={styles.sectionCardHeader}>
                  <TextInput
                    style={styles.sectionTitleInput}
                    value={sec.title}
                    onChangeText={(text) => handleRenameSection(sec.sectionId, text)}
                    placeholder="Section Name (e.g. Appetizers)"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity 
                    style={styles.deleteSectionBtn} 
                    onPress={() => handleDeleteSection(sec.sectionId, sec.title)}
                  >
                    <Trash2 size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>

                {/* Section Items */}
                <View style={styles.itemsList}>
                  {sec.items.map((item) => (
                    <View key={item.itemId} style={styles.itemRow}>
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>{item.price} {item.currency}</Text>
                        {item.description ? (
                          <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                        ) : null}
                      </View>
                      <View style={styles.itemActions}>
                        <TouchableOpacity 
                          style={styles.iconButton} 
                          onPress={() => handleOpenEditItem(sec.sectionId, item)}
                        >
                          <Edit3 size={16} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.iconButton} 
                          onPress={() => handleDeleteItem(sec.sectionId, item.itemId)}
                        >
                          <Trash2 size={16} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity 
                    style={styles.addItemBtn} 
                    onPress={() => handleOpenAddItem(sec.sectionId)}
                  >
                    <Plus size={16} color="#666" />
                    <Text style={styles.addItemBtnText}>Add Item</Text>
                  </TouchableOpacity>
                </View>

              </View>
            ))
          )}
        </View>

        {/* Menu Photos Attachments Section */}
        <View style={styles.photosContainer}>
          <Text style={styles.sectionGroupTitle}>Menu Photos (Attachments)</Text>
          <Text style={styles.photoInstructions}>
            Add custom menu image links. These will display in a beautiful photo gallery for customers.
          </Text>

          <View style={styles.addPhotoRow}>
            <TextInput
              style={styles.photoUrlInput}
              value={newPhotoUrl}
              onChangeText={setNewPhotoUrl}
              placeholder="Paste image URL (https://...)"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhotoUrl}>
              <Text style={styles.addPhotoBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {menu.menuPhotos && menu.menuPhotos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
              {menu.menuPhotos.map((url, idx) => (
                <View key={idx} style={styles.photoThumbWrapper}>
                  <Image source={{ uri: url }} style={styles.photoThumb} contentFit="cover" />
                  <TouchableOpacity style={styles.deletePhotoThumbBtn} onPress={() => handleDeletePhotoUrl(url)}>
                    <X size={12} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noPhotosContainer}>
              <ImageIcon size={24} color="#AAA" />
              <Text style={styles.noPhotosText}>No menu photo attachments added yet.</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Edit / Add Item Modal */}
      <Modal
        visible={itemModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setItemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isNewItem ? 'Add Menu Item' : 'Edit Menu Item'}</Text>
              <TouchableOpacity onPress={() => setItemModalVisible(false)}>
                <X size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              
              {/* Item Name (AR/EN or main) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Item Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Margherita Pizza"
                  value={editingItem?.name || ''}
                  onChangeText={(text) => setEditingItem(prev => ({ ...prev, name: text }))}
                />
              </View>

              {/* Item Name English (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>English Name (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Margherita Pizza (English)"
                  value={editingItem?.nameEn || ''}
                  onChangeText={(text) => setEditingItem(prev => ({ ...prev, nameEn: text }))}
                />
              </View>

              {/* Price & Currency */}
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>Price *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 150"
                    keyboardType="numeric"
                    value={editingItem?.price ? String(editingItem.price) : ''}
                    onChangeText={(text) => setEditingItem(prev => ({ ...prev, price: Number(text) || 0 }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={styles.inputLabel}>Currency</Text>
                  <TextInput
                    style={[styles.modalInput, styles.disabledInput]}
                    value="EGP"
                    editable={false}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.textAreaInput]}
                  placeholder="e.g. Rich tomato sauce, mozzarella cheese, and fresh basil."
                  multiline
                  numberOfLines={3}
                  value={editingItem?.description || ''}
                  onChangeText={(text) => setEditingItem(prev => ({ ...prev, description: text }))}
                />
              </View>

              {/* Image URL */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Item Photo URL (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="https://example.com/photo.jpg"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={editingItem?.photo || ''}
                  onChangeText={(text) => setEditingItem(prev => ({ ...prev, photo: text }))}
                />
              </View>

              {/* Tags (Tags comma-separated parsing helper) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tags (Comma-separated, e.g. Spicy, Veg)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Spicy, Popular, Vegetarian"
                  value={editingItem?.tags?.join(', ') || ''}
                  onChangeText={(text) => {
                    const parsedTags = text.split(',').map(tag => tag.trim()).filter(Boolean);
                    setEditingItem(prev => ({ ...prev, tags: parsedTags }));
                  }}
                />
              </View>

            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setItemModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveItemModal}>
                <Text style={styles.modalSaveBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

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
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4
  },
  saveButtonDisabled: { backgroundColor: '#FFB580' },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#FFF' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Sections
  sectionsContainer: { marginBottom: 24 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionGroupTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  addSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  addSectionBtnText: { color: '#FF6B00', fontSize: 13, fontWeight: '600' },
  
  emptyContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center'
  },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
    marginBottom: 12
  },
  sectionTitleInput: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    flex: 1,
    marginRight: 12,
    paddingVertical: 4
  },
  deleteSectionBtn: { padding: 4 },

  // Items List
  itemsList: { gap: 10 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  itemDetails: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  itemPrice: { fontSize: 13, fontWeight: 'bold', color: '#FF6B00', marginBottom: 2 },
  itemDesc: { fontSize: 12, color: '#777' },
  itemActions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center'
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CCC',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4
  },
  addItemBtnText: { color: '#666', fontSize: 13, fontWeight: '600' },

  // Photos Container
  photosContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 16,
    marginBottom: 16
  },
  photoInstructions: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 12 },
  addPhotoRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  photoUrlInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  addPhotoBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8
  },
  addPhotoBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  photosScroll: { flexDirection: 'row', gap: 12 },
  photoThumbWrapper: { position: 'relative', marginRight: 12 },
  photoThumb: { width: 80, height: 80, borderRadius: 8 },
  deletePhotoThumbBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF'
  },
  noPhotosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8
  },
  noPhotosText: { color: '#AAA', fontSize: 13 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  modalScrollContent: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111'
  },
  disabledInput: { backgroundColor: '#EAEAEA', color: '#666' },
  inputRow: { flexDirection: 'row' },
  textAreaInput: { height: 70, textAlignVertical: 'top' },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA'
  },
  modalCancelBtnText: { color: '#666', fontWeight: 'bold', fontSize: 15 },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  modalSaveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 }
});
