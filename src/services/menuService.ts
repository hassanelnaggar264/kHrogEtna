import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { PlaceMenu } from '../types/schema';
import { MOCK_MENUS } from '../data/mockMenus';

// Session-level cache for menus to ensure immediate, robust offline updates
const memoryMenuCache = new Map<string, PlaceMenu>();

/**
 * Fetches the structured menu for a business.
 * Attempts to read from memory cache first, then Firestore, and falls back to MOCK_MENUS if needed.
 */
export const getPlaceMenu = async (businessId: string): Promise<PlaceMenu> => {
  // 1. Check memory cache (stores recent user edits in current app session)
  if (memoryMenuCache.has(businessId)) {
    return memoryMenuCache.get(businessId)!;
  }

  try {
    // 2. Attempt to read from Firestore (menus/{businessId})
    const docRef = doc(db, 'menus', businessId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const dbMenu = docSnap.data() as PlaceMenu;
      // Sync memory cache
      memoryMenuCache.set(businessId, dbMenu);
      return dbMenu;
    }
  } catch (err) {
    console.log(`Firestore getMenu failed for ${businessId}, falling back to local dataset:`, err);
  }

  // 3. Fallback to predefined mock menu
  const mockMenu = MOCK_MENUS.find(m => m.businessId === businessId);
  if (mockMenu) {
    // Clone to prevent direct modifications of the seed file
    const clonedMenu = JSON.parse(JSON.stringify(mockMenu)) as PlaceMenu;
    memoryMenuCache.set(businessId, clonedMenu);
    return clonedMenu;
  }

  // 4. Default empty menu if no match found
  const emptyMenu: PlaceMenu = {
    businessId,
    sections: [],
    menuPhotos: []
  };
  memoryMenuCache.set(businessId, emptyMenu);
  return emptyMenu;
};

/**
 * Saves/updates the structured menu for a business.
 * Writes to memory cache and attempts to write to Firestore.
 */
export const savePlaceMenu = async (businessId: string, menuData: PlaceMenu): Promise<void> => {
  // 1. Update session memory cache
  memoryMenuCache.set(businessId, menuData);

  try {
    // 2. Attempt to save to Firestore (menus/{businessId})
    const docRef = doc(db, 'menus', businessId);
    await setDoc(docRef, menuData);
    console.log(`Successfully saved menu to Firestore for ${businessId}`);
  } catch (err) {
    console.log(`Firestore saveMenu failed for ${businessId}, saved locally in-memory:`, err);
    // Throw error if we want the caller to handle UI warning, but saving in memory makes it still work
  }
};
