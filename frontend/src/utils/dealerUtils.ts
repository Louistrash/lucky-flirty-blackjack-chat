/**
 * Utility functions for dealer management
 */

import { getValidImageUrl } from './placeholderImages';

/**
 * Generates a dealer ID from a name
 * @param name The dealer's name
 * @returns A formatted dealer ID
 */
export const generateDealerIdFromName = (name: string): string => {
  if (!name.trim()) return '';
  
  // Convert to lowercase, remove special characters, replace spaces with underscores
  const cleanName = name
    .toLowerCase()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accents
    .replace(/[^a-z0-9\s]/g, '') // Keep only letters, numbers, and spaces
    .trim()
    .replace(/\s+/g, '_'); // Replace spaces with underscores
  
  // Add a timestamp suffix to ensure uniqueness
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
  
  return `dealer_${cleanName}_${timestamp}`;
};

/**
 * Validates if a dealer has sufficient data for carrousel display
 * @param dealer The dealer data to validate
 * @returns Object with validation result and message
 */
export const validateDealerForCarrousel = (dealer: any): { isValid: boolean; message: string } => {
  // Check required fields
  if (!dealer.name?.trim()) {
    return { isValid: false, message: 'Dealer name is required' };
  }
  
  if (!dealer.id?.trim()) {
    return { isValid: false, message: 'Dealer ID is required' };
  }
  
  // Check if dealer has at least one image (avatar or ANY outfit stage)
  const hasAvatar = dealer.avatarUrl?.trim();
  // const hasFirstOutfitImage = dealer.outfitStages?.[0]?.imageUrl?.trim(); // Oude check
  const hasAnyOutfitImage = dealer.outfitStages?.some(stage => stage.imageUrl?.trim()); // Nieuwe check
  
  if (!hasAvatar && !hasAnyOutfitImage) { // Aangepaste conditie
    return { 
      isValid: false, 
      message: 'At least one image is required (Avatar or any outfit image)' // Aangepaste boodschap
    };
  }
  
  return { isValid: true, message: 'Dealer is ready for carousel' };
};

/**
 * Gets the primary display image for a dealer (for carrousel use)
 * @param dealer The dealer data
 * @returns The URL of the primary image to display
 */
export const getDealerPrimaryImage = (dealer: any): string => {
  // Priority: avatarUrl > first outfit image > placeholder
  if (dealer.avatarUrl?.trim()) {
    return dealer.avatarUrl;
  }
  
  if (dealer.outfitStages?.[0]?.imageUrl?.trim()) {
    return dealer.outfitStages[0].imageUrl;
  }
  
  return getValidImageUrl(undefined, 'DEALER_CARD');
};

/**
 * Suggests a dealer name based on common patterns
 * @returns A random suggested name
 */
export const suggestDealerName = (): string => {
  const names = [
    'Sophia', 'Isabella', 'Emma', 'Olivia', 'Ava',
    'Emily', 'Abigail', 'Madison', 'Mia', 'Chloe',
    'Elizabeth', 'Ella', 'Addison', 'Natalie', 'Lily',
    'Grace', 'Samantha', 'Avery', 'Sofia', 'Aria'
  ];
  
  return names[Math.floor(Math.random() * names.length)];
}; 