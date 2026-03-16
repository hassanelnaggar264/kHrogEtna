import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const StorageService = {
    /**
     * Uploads a profile image to Firebase Storage.
     * @param {string} userId - The user's ID.
     * @param {string} uri - The local file URI of the image.
     * @returns {Promise<string>} - The download URL of the uploaded image.
     */
    uploadProfileImage: async (userId, uri) => {
        if (!uri) return null;

        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const filename = `profile_images/${userId}_${Date.now()}.jpg`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            return downloadURL;
        } catch (error) {
            console.error("Error uploading profile image: ", error);
            throw error;
        }
    }
};
