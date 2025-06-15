// Local Image Storage Utility
// Fallback for Firebase Storage when not available (requires Blaze plan)

import { getValidImageUrl } from './placeholderImages';

/**
 * Converts File to base64 data URL for storage in Firestore
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Optimize image for local storage with ultra compression for form fields
 * This creates much smaller base64 URLs to avoid the page-long URL problem
 */
export const optimizeImageForForm = async (
  file: File, 
  maxWidth: number = 200, // Much smaller for forms
  maxHeight: number = 200, 
  quality: number = 0.4  // Lower quality for forms
): Promise<string> => {
  console.log(`🗜️ Ultra-compressing image for form: ${file.name} (${formatFileSize(file.size)})`);
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio
      let { width, height } = img;
      
      // Scale down to fit within maxWidth/maxHeight
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Enable image smoothing for better quality at small sizes
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        const originalSizeKB = Math.round(file.size / 1024);
        const compressedSizeKB = Math.round(compressedBase64.length * 0.75 / 1024);
        const reduction = Math.round((1 - compressedSizeKB / originalSizeKB) * 100);
        
        console.log(`✅ Image compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${reduction}% reduction)`);
        
        // Warn if still too large for comfortable use
        if (compressedSizeKB > 50) {
          console.warn(`⚠️ Compressed image is still large (${compressedSizeKB}KB). Consider further compression.`);
        }
        
        resolve(compressedBase64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Optimize image with smart compression based on use case
 */
export const optimizeImage = async (
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8,
  useCase: 'display' | 'storage' | 'form' = 'display'
): Promise<string> => {
  // Use ultra compression for form fields to avoid long URLs
  if (useCase === 'form' || maxWidth <= 400) {
    return optimizeImageForForm(file, maxWidth, maxWidth, Math.min(quality, 0.6));
  }
  
  // ... existing optimizeImage code continues with the same logic ...
  console.log(`📷 Optimizing image: ${file.name} (${formatFileSize(file.size)})`);
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = (width * maxWidth) / height;
          height = maxWidth;
        }
      }
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw image with optimization
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const originalSizeKB = Math.round(file.size / 1024);
        const optimizedSizeKB = Math.round(optimizedDataUrl.length * 0.75 / 1024);
        
        console.log(`📊 Optimization result: ${originalSizeKB}KB → ${optimizedSizeKB}KB`);
        resolve(optimizedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Upload image with local storage fallback
 * If Firebase Storage is not available, store as optimized base64 in Firestore
 */
export const uploadImageWithFallback = async (
  path: string,
  file: File,
  useFirebaseStorage: boolean = false
): Promise<string> => {
  if (useFirebaseStorage) {
    // Try Firebase Storage first (requires implementation)
    try {
      const { uploadImageAndGetURL } = await import('./adminDealerManager');
      return await uploadImageAndGetURL(path, file);
    } catch (error) {
      console.warn('Firebase Storage failed, falling back to local storage:', error);
    }
  }
  
  // Fallback to optimized base64 storage
  console.log('Using local image storage for:', path);
  return await optimizeImage(file, 600, 0.7); // Smaller size for Firestore storage
};

/**
 * Check if a string is a base64 data URL
 */
export const isBase64DataUrl = (url: string): boolean => {
  return url.startsWith('data:image/');
};

/**
 * Get appropriate image URL for display
 * Handles both Firebase Storage URLs and base64 data URLs
 */
export const getDisplayImageUrl = (imageUrl: string, fallbackUrl?: string): string => {
  if (!imageUrl && fallbackUrl) {
    return fallbackUrl;
  }
  if (!imageUrl || imageUrl === "" || imageUrl === "null" || imageUrl === "undefined") {
    return getValidImageUrl(undefined, 'DEALER_CARD');
  }
  return imageUrl; // Works for both base64 and HTTP URLs
};

/**
 * Storage size estimation for base64 strings
 */
export const estimateBase64Size = (base64String: string): number => {
  // Remove data URL prefix if present
  const base64Data = base64String.split(',')[1] || base64String;
  // Each base64 character represents 6 bits, so multiply by 3/4 to get bytes
  return Math.ceil((base64Data.length * 3) / 4);
};

/**
 * Human readable file size
 */
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}; 