import { collection, getDocs, doc, setDoc, updateDoc, writeBatch, Timestamp, deleteDoc, getDoc } from "firebase/firestore"; // Added deleteDoc and getDoc
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; // Import Firebase Storage
import { firestore, getFirebaseStorage, isStorageAvailable } from "../app/auth/firebase";
import { uploadImageWithFallback, isBase64DataUrl } from "./localImageStorage";

const db = firestore;

// --- Interfaces --- 
// Replicating relevant parts of DealerProfile and OutfitStage for clarity
// In a larger app, these would be in a central types file
export interface OutfitStageData {
  stageName: string;
  imageUrl: string;
  personalityPrompt: string;
}

export interface DealerData {
  id: string; // Firestore document ID
  name: string;
  title?: string; // Toegevoegd voor subtitels zoals "Baccarat Beauty"
  avatarUrl: string;
  professionalImageUrl?: string; // Alternative professional image
  experience?: string; // Bijv. "Expert", "Professional"
  displayWinRate?: string; // Bijv. "88%", als tekstuele weergave
  isActive: boolean;
  gender?: string; // Gender of the dealer
  specialties?: string[]; // Dealer specialties (e.g., "Blackjack", "Baccarat")
  shortDescription?: string; // Brief description of the dealer
  outfitStages: OutfitStageData[];
  gameStats?: { // Optional game statistics
    totalGamesPlayed: number;
    playerWinRateAgainst: number;
  };
  createdAt?: Timestamp; // Optional: for tracking when dealer was added
  updatedAt?: Timestamp; // Optional: for tracking last update
}

const DEALERS_COLLECTION = "dealers";

// --- Firestore Functions --- 

/**
 * Fetches all dealer profiles from Firestore.
 */
export const getDealers = async (): Promise<DealerData[]> => {
  try {
    const dealersCollection = collection(db, DEALERS_COLLECTION);
    const querySnapshot = await getDocs(dealersCollection);
    const dealers: DealerData[] = [];
    querySnapshot.forEach((doc) => {
      dealers.push({ id: doc.id, ...doc.data() } as DealerData);
    });
    console.log("Fetched dealers:", dealers);
    return dealers;
  } catch (error) {
    console.error("Error fetching dealers:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * Fetches a single dealer profile from Firestore by ID.
 */
export const getDealer = async (dealerId: string): Promise<DealerData | null> => {
  if (!dealerId) {
    console.error("Dealer ID is required to fetch a dealer.");
    throw new Error("Dealer ID is required.");
  }
  try {
    const dealerRef = doc(db, DEALERS_COLLECTION, dealerId);
    const docSnap = await getDoc(dealerRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as DealerData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching dealer:", dealerId, error);
    throw error;
  }
};

/**
 * Adds a new dealer profile to Firestore.
 * The `id` field in dealerData will be used as the document ID.
 * If `id` is not provided or is empty, Firestore will auto-generate an ID,
 * but for dealer management, it's often better to define IDs (e.g., "dealer1_sophia").
 */
export const addDealer = async (dealerData: Omit<DealerData, 'createdAt' | 'updatedAt'>): Promise<void> => {
  if (!dealerData.id) {
    console.error("Dealer ID is required to add a dealer.");
    throw new Error("Dealer ID is required.");
  }
  try {
    const dealerRef = doc(db, DEALERS_COLLECTION, dealerData.id);
    const now = Timestamp.now();
    await setDoc(dealerRef, { 
      ...dealerData, 
      createdAt: now, 
      updatedAt: now 
    });
    console.log("Dealer added successfully with ID:", dealerData.id);
  } catch (error) {
    console.error("Error adding dealer:", error);
    throw error;
  }
};

/**
 * Updates just the dealer's name in Firestore
 */
export const updateDealerName = async (dealerId: string, newName: string): Promise<void> => {
  if (!dealerId) {
    throw new Error("Dealer ID is required.");
  }
  if (!newName || newName.trim() === "") {
    throw new Error("New name is required.");
  }

  try {
    const cleanName = newName.trim(); // Remove leading/trailing spaces
    await updateDealer(dealerId, { name: cleanName });
    console.log(`✅ Dealer ${dealerId} name updated to: "${cleanName}"`);
  } catch (error) {
    console.error(`❌ Error updating dealer name for ${dealerId}:`, error);
    throw error;
  }
};

/**
 * Updates an existing dealer profile in Firestore.
 */
export const updateDealer = async (dealerId: string, updates: Partial<Omit<DealerData, 'id' | 'createdAt'>>): Promise<void> => {
  if (!dealerId) {
    console.error("Dealer ID is required to update a dealer.");
    throw new Error("Dealer ID is required.");
  }
  try {
    const dealerRef = doc(db, DEALERS_COLLECTION, dealerId);
    const updatePayload = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    console.log(`🔄 Updating dealer ${dealerId} with:`, updatePayload);
    await updateDoc(dealerRef, updatePayload);
    console.log(`✅ Dealer ${dealerId} updated successfully in Firestore`);
  } catch (error) {
    console.error(`❌ Error updating dealer ${dealerId}:`, error);
    throw error;
  }
};

/**
 * Updates a specific outfit stage image URL for a dealer in Firestore.
 */
export const updateDealerOutfitImage = async (dealerId: string, stageIndex: number, imageUrl: string): Promise<void> => {
  if (!dealerId) {
    console.error("Dealer ID is required to update an outfit image.");
    throw new Error("Dealer ID is required.");
  }
  if (stageIndex < 0) {
    console.error("Stage index must be a non-negative number.");
    throw new Error("Invalid stage index.");
  }

  try {
    const dealer = await getDealer(dealerId);
    if (!dealer) {
      throw new Error(`Dealer with ID ${dealerId} not found.`);
    }

    if (!dealer.outfitStages || stageIndex >= dealer.outfitStages.length) {
      console.error(`Outfit stage at index ${stageIndex} does not exist for dealer ${dealerId}. Current stages:`, dealer.outfitStages);
      throw new Error(`Outfit stage at index ${stageIndex} does not exist.`);
    }

    // Create a new array for outfitStages to ensure React state updates correctly if this data is used directly
    const updatedOutfitStages = [...dealer.outfitStages];
    updatedOutfitStages[stageIndex] = {
      ...updatedOutfitStages[stageIndex],
      imageUrl: imageUrl,
    };

    await updateDealer(dealerId, { outfitStages: updatedOutfitStages });
    console.log(`Dealer ${dealerId} outfit stage ${stageIndex} image updated successfully.`);

  } catch (error) {
    console.error(`Error updating outfit image for dealer ${dealerId}, stage ${stageIndex}:`, error);
    throw error;
  }
};

/**
 * Toggles the isActive status of a dealer.
 */
export const setDealerStatus = async (dealerId: string, isActive: boolean): Promise<void> => {
  if (!dealerId) {
    console.error("Dealer ID is required to set status.");
    throw new Error("Dealer ID is required.");
  }
  try {
    await updateDealer(dealerId, { isActive });
    console.log(`Dealer ${dealerId} status set to ${isActive ? 'active' : 'inactive'}`);
  } catch (error) {
    console.error("Error setting dealer status:", dealerId, error);
    throw error;
  }
};

/**
 * Deletes a dealer from Firestore. 
 * Consider using a soft delete (setting isActive to false) instead for better data retention.
 */
export const deleteDealer = async (dealerId: string): Promise<void> => {
  if (!dealerId) {
    console.error("Dealer ID is required to delete a dealer.");
    throw new Error("Dealer ID is required.");
  }
  try {
    const dealerRef = doc(db, DEALERS_COLLECTION, dealerId);
    await deleteDoc(dealerRef); // Firestore's deleteDoc function
    console.log("Dealer deleted successfully:", dealerId);
  } catch (error) {
    console.error("Error deleting dealer:", dealerId, error);
    // Ensure firebase/firestore is imported for deleteDoc if not already
    // For this snippet, assuming deleteDoc is available via a global or broader import pattern.
    // Explicit import would be: import { deleteDoc } from "firebase/firestore";
    throw error;
  }
};

// --- Admin Authorization Check --- 
const ADMIN_USERS_COLLECTION = "admin_users";

/**
 * Checks if a user is an admin by looking up their UID in the admin_users collection.
 * @param userId The UID of the user to check.
 * @returns Promise<boolean> True if the user is an admin, false otherwise.
 */
export const isAdminUser = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    const adminUserDocRef = doc(db, ADMIN_USERS_COLLECTION, userId);
    const docSnap = await getDoc(adminUserDocRef);
    return docSnap.exists(); // If the document exists, the user is an admin
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false; // Default to not admin in case of error
  }
};

/**
 * Adds a user to the admin_users collection, granting them admin privileges.
 * @param uid The UID of the user to make an admin.
 */
export const addAdminUserByUid = async (uid: string): Promise<void> => {
  if (!uid || uid.trim() === "") {
    console.error("UID is required to add an admin user.");
    throw new Error("UID is required.");
  }
  try {
    const adminUserDocRef = doc(db, ADMIN_USERS_COLLECTION, uid);
    // We just need the document to exist. It can be empty.
    await setDoc(adminUserDocRef, {}); 
    console.log(`User ${uid} successfully added as an admin.`);
  } catch (error) {
    console.error(`Error adding admin user ${uid}:`, error);
    throw error;
  }
};

/**
 * Seeds the Firestore database with dummy dealer data.
 * This is useful for initial setup or testing purposes.
 * Only adds dealers that don't already exist (based on ID).
 */
export const seedDummyDealers = async (): Promise<{ added: number; skipped: number; errors: string[] }> => {
  try {
    const { dummyDealers } = await import('./dummyDealerData');
    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const dealer of dummyDealers) {
      try {
        // Check if dealer already exists
        const existingDealer = await getDealer(dealer.id);
        if (existingDealer) {
          console.log(`Dealer ${dealer.id} already exists, skipping...`);
          skipped++;
          continue;
        }
      } catch (error) {
        // Dealer doesn't exist, which is what we want
      }

      try {
        await addDealer(dealer);
        console.log(`Added dealer: ${dealer.name} (${dealer.id})`);
        added++;
      } catch (error) {
        const errorMessage = `Failed to add dealer ${dealer.id}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        errors.push(errorMessage);
        skipped++;
      }
    }

    console.log(`Seeding completed: ${added} added, ${skipped} skipped, ${errors.length} errors`);
    return { added, skipped, errors };
  } catch (error) {
    console.error('Failed to seed dummy dealers:', error);
    throw error;
  }
};

/**
 * Clears all dealers from Firestore.
 * Use with caution - this will delete all dealer data!
 */
export const clearAllDealers = async (): Promise<number> => {
  try {
    const dealers = await getDealers();
    const batch = writeBatch(db);
    
    dealers.forEach(dealer => {
      const dealerRef = doc(db, DEALERS_COLLECTION, dealer.id);
      batch.delete(dealerRef);
    });

    if (dealers.length > 0) {
      await batch.commit();
      console.log(`Successfully deleted ${dealers.length} dealers from Firestore`);
    }

    return dealers.length;
  } catch (error) {
    console.error("Error clearing dealers:", error);
    throw error;
  }
};

// Example of how to add initial dealers (e.g., from dealerData.ts if needed once)
// This is for seeding data, not for regular app flow.
/*
import { dealerDataList } from './dealerData'; // Assuming your local data is here

export const seedInitialDealers = async () => {
  const batch = writeBatch(db);
  const now = Timestamp.now();

  dealerDataList.forEach(dealer => {
    const dealerRef = doc(db, DEALERS_COLLECTION, dealer.id);
    const dealerPayload: DealerData = {
      ...dealer,
      // Ensure all fields match DealerData, especially outfitStages if their structure differs
      // Add createdAt and updatedAt
      createdAt: now,
      updatedAt: now,
    };
    batch.set(dealerRef, dealerPayload);
  });

  try {
    await batch.commit();
    console.log("Successfully seeded initial dealers to Firestore.");
  } catch (error) {
    console.error("Error seeding initial dealers:", error);
  }
};
*/

export const uploadImageAndGetURL = async (path: string, file: File): Promise<string> => {
  // Use backend API for Firebase Storage uploads
  try {
    console.log(`🔄 Uploading image via backend API: ${path}`);
    const { uploadImageViaBackend } = await import('./backendUpload');
    return await uploadImageViaBackend(path, file);
  } catch (error) {
    console.error("❌ Backend upload failed, using local fallback:", error);
    return await uploadImageWithFallback(path, file, false);
  }
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Enhanced upload function that prioritizes Firebase Storage with WebP conversion
 * NO MORE BASE64 FALLBACKS - Fast WebP delivery only!
 */
export const uploadImageWithUserFeedback = async (path: string, file: File): Promise<{ url: string; method: 'firebase' }> => {
  console.log(`📤 Uploading image: ${file.name} (${formatFileSize(file.size)})`);
  console.log('🎯 Target: Firebase Storage only with WebP conversion');
  
  // **ALLEEN FIREBASE STORAGE MET WEBP CONVERSIE**
  try {
    console.log('🔥 Uploading to Firebase Storage with WebP conversion...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', path.split('/').slice(0, -1).join('/') || 'uploads');
    formData.append('convert_webp', 'true');
    formData.append('webp_quality', '85');
    
    const response = await fetch('/api/firebase-storage/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.storage_method === 'firebase_storage') {
        console.log('✅ Firebase Storage WebP upload successful!');
        console.log(`📊 File: ${result.file_name}`);
        console.log(`🌐 URL: ${result.download_url}`);
        return { url: result.download_url, method: 'firebase' };
      } else {
        throw new Error(`Upload failed: ${result.message}`);
      }
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Firebase Storage upload failed:', error);
    throw new Error(`Firebase Storage upload failed: ${error.message}. Base64 fallback is disabled for performance.`);
  }
};

/**
 * Deletes an image from Firebase Storage.
 * @param imageUrl The HTTPS URL of the image to delete.
 */
export const deleteImageByUrl = async (imageUrl: string): Promise<void> => {
  if (!imageUrl.startsWith("https://firebasestorage.googleapis.com")) {
    console.warn("URL is not a Firebase Storage URL, skipping delete:", imageUrl);
    return;
  }
  
  // Check if storage is available
  if (!isStorageAvailable()) {
    console.warn("Firebase Storage is not available - skipping delete operation");
    return;
  }
  
  const storage = getFirebaseStorage();
  if (!storage) {
    console.warn("Firebase Storage is not available, skipping delete:", imageUrl);
    return;
  }
  
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log("Image deleted successfully from Storage:", imageUrl);
  } catch (error) {
    // It's common for delete to fail if the file doesn't exist, 
    // or if rules prevent it. We can log this but not necessarily throw a hard error for the user.
    console.error("Error deleting image from Storage:", imageUrl, error);
    // For now, just log and continue.
  }
};

/**
 * Convert existing base64 image to Firebase Storage WebP format
 * This helps migrate from the old base64 system to fast WebP delivery
 */
export const convertBase64ToFirebaseStorage = async (
  dealerId: string, 
  stageIndex: number, 
  base64Url: string
): Promise<string> => {
  console.log(`🔄 Converting base64 image to Firebase Storage for ${dealerId} stage ${stageIndex}`);
  
  try {
    // Convert base64 to File object
    const response = await fetch(base64Url);
    const blob = await response.blob();
    
    // Create filename
    const fileName = `converted_${Date.now()}.webp`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    
    // Upload via Firebase Storage with WebP conversion
    const path = `dealers/${dealerId}/outfits/stage_${stageIndex}/${fileName}`;
    const result = await uploadImageWithUserFeedback(path, file);
    
    console.log(`✅ Base64 converted to Firebase Storage: ${result.url}`);
    return result.url;
    
  } catch (error) {
    console.error(`❌ Base64 conversion failed for ${dealerId}:`, error);
    throw error;
  }
};

/**
 * Bulk convert all base64 images for a dealer to Firebase Storage
 */
export const convertAllBase64ImagesForDealer = async (dealerId: string): Promise<void> => {
  try {
    const dealer = await getDealer(dealerId);
    if (!dealer) {
      throw new Error(`Dealer ${dealerId} not found`);
    }

    console.log(`🔄 Converting all base64 images for dealer ${dealerId}`);
    let convertedCount = 0;

    // Convert avatar if it's base64
    if (dealer.avatarUrl && isBase64DataUrl(dealer.avatarUrl)) {
      try {
        console.log(`🔄 Converting avatar for ${dealerId}`);
        const response = await fetch(dealer.avatarUrl);
        const blob = await response.blob();
        const file = new File([blob], `avatar_${Date.now()}.webp`, { type: 'image/jpeg' });
        const path = `dealers/${dealerId}/avatar/avatar_${Date.now()}.webp`;
        const result = await uploadImageWithUserFeedback(path, file);
        
        await updateDealer(dealerId, { avatarUrl: result.url });
        console.log(`✅ Avatar converted for ${dealerId}`);
        convertedCount++;
      } catch (error) {
        console.warn(`⚠️ Failed to convert avatar for ${dealerId}:`, error);
      }
    }

    // Convert outfit stage images
    if (dealer.outfitStages) {
      for (let i = 0; i < dealer.outfitStages.length; i++) {
        const stage = dealer.outfitStages[i];
        if (stage.imageUrl && isBase64DataUrl(stage.imageUrl)) {
          try {
            console.log(`🔄 Converting stage ${i} for ${dealerId}`);
            const convertedUrl = await convertBase64ToFirebaseStorage(dealerId, i, stage.imageUrl);
            await updateDealerOutfitImage(dealerId, i, convertedUrl);
            console.log(`✅ Stage ${i} converted for ${dealerId}`);
            convertedCount++;
          } catch (error) {
            console.warn(`⚠️ Failed to convert stage ${i} for ${dealerId}:`, error);
          }
        }
      }
    }

    console.log(`✅ Conversion complete for ${dealerId}: ${convertedCount} images converted`);
  } catch (error) {
    console.error(`❌ Bulk conversion failed for ${dealerId}:`, error);
    throw error;
  }
};


