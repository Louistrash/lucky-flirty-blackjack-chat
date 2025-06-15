import { optimizeImageForForm } from './localImageStorage';

/**
 * Compress existing base64 image URL to much smaller size
 * This helps fix the page-long URL problem
 */
export const compressBase64Image = async (
  base64Url: string,
  maxWidth: number = 300,
  quality: number = 0.5
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!base64Url || !base64Url.startsWith('data:image/')) {
      resolve(base64Url); // Return as-is if not base64
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate new dimensions
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

      canvas.width = width;
      canvas.height = height;

      // Enable high quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      try {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        
        // Log compression results
        const originalSizeKB = Math.round(base64Url.length * 0.75 / 1024);
        const compressedSizeKB = Math.round(compressed.length * 0.75 / 1024);
        const reduction = Math.round((1 - compressedSizeKB / originalSizeKB) * 100);
        
        console.log(`🗜️ Base64 compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB (${reduction}% reduction)`);
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Url;
  });
};

/**
 * Batch compress multiple base64 URLs
 */
export const compressMultipleBase64Images = async (
  imageUrls: string[],
  maxWidth: number = 300,
  quality: number = 0.5
): Promise<string[]> => {
  const promises = imageUrls.map(url => compressBase64Image(url, maxWidth, quality));
  return Promise.all(promises);
};

/**
 * Smart image URL processor - compresses base64, leaves Firebase URLs intact
 */
export const processImageUrl = async (
  imageUrl: string,
  maxWidth: number = 300,
  quality: number = 0.5
): Promise<string> => {
  if (!imageUrl) return '';
  
  // If it's a Firebase Storage URL, return as-is
  if (imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
    return imageUrl;
  }
  
  // If it's a base64 URL, compress it
  if (imageUrl.startsWith('data:image/')) {
    return compressBase64Image(imageUrl, maxWidth, quality);
  }
  
  // Return other URLs as-is
  return imageUrl;
};

/**
 * Get display-friendly image URL info
 */
export const getImageUrlInfo = (imageUrl: string) => {
  if (!imageUrl) {
    return { type: 'empty', size: '0KB', displayLength: 0 };
  }
  
  if (imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
    return { 
      type: 'firebase', 
      size: 'Unknown', 
      displayLength: imageUrl.length,
      short: imageUrl.substring(0, 50) + '...'
    };
  }
  
  if (imageUrl.startsWith('data:image/')) {
    const sizeKB = Math.round(imageUrl.length * 0.75 / 1024);
    return { 
      type: 'base64', 
      size: `${sizeKB}KB`, 
      displayLength: imageUrl.length,
      short: `data:image/... (${sizeKB}KB)`
    };
  }
  
  return { 
    type: 'url', 
    size: 'Unknown', 
    displayLength: imageUrl.length,
    short: imageUrl.length > 50 ? imageUrl.substring(0, 50) + '...' : imageUrl
  };
};

/**
 * URL compression utility for dealer forms
 */
export const fixLongImageUrls = async (dealerData: any): Promise<any> => {
  const processedDealer = { ...dealerData };
  
  // Compress avatar if it's base64
  if (processedDealer.avatarUrl) {
    processedDealer.avatarUrl = await processImageUrl(processedDealer.avatarUrl, 300, 0.6);
  }
  
  // Compress outfit images
  if (processedDealer.outfitStages) {
    for (let i = 0; i < processedDealer.outfitStages.length; i++) {
      if (processedDealer.outfitStages[i].imageUrl) {
        processedDealer.outfitStages[i].imageUrl = await processImageUrl(
          processedDealer.outfitStages[i].imageUrl, 
          300, 
          0.5
        );
      }
    }
  }
  
  return processedDealer;
}; 