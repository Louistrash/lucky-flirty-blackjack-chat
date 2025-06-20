// Upload Monitor Utility
// Monitors upload progress and verifies storage

export const logUploadProgress = (stage: string, message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`🔄 [${timestamp}] ${stage}: ${message}`);
};

export const verifyImageUpload = async (imageUrl: string): Promise<{
  isValid: boolean;
  type: 'firebase' | 'base64' | 'external' | 'invalid';
  size?: string;
  details: string;
}> => {
  if (!imageUrl) {
    return {
      isValid: false,
      type: 'invalid',
      details: 'No image URL provided'
    };
  }

  if (imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
    // Test Firebase Storage URL
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return {
        isValid: response.ok,
        type: 'firebase',
        size: response.headers.get('content-length') ? `${Math.round(parseInt(response.headers.get('content-length')!) / 1024)}KB` : 'Unknown',
        details: response.ok ? 'Firebase Storage URL accessible' : `Firebase URL error: ${response.status}`
      };
    } catch (error) {
      return {
        isValid: false,
        type: 'firebase',
        details: `Firebase URL test failed: ${error}`
      };
    }
  }

  if (imageUrl.startsWith('data:image/')) {
    // Base64 image
    const sizeKB = Math.round(imageUrl.length * 0.75 / 1024);
    return {
      isValid: true,
      type: 'base64',
      size: `${sizeKB}KB`,
      details: `Base64 image, ${sizeKB}KB compressed`
    };
  }

  if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
    // External URL
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return {
        isValid: response.ok,
        type: 'external',
        size: response.headers.get('content-length') ? `${Math.round(parseInt(response.headers.get('content-length')!) / 1024)}KB` : 'Unknown',
        details: response.ok ? 'External URL accessible' : `External URL error: ${response.status}`
      };
    } catch (error) {
      return {
        isValid: false,
        type: 'external',
        details: `External URL test failed: ${error}`
      };
    }
  }

  return {
    isValid: false,
    type: 'invalid',
    details: 'Unknown image URL format'
  };
};

export const checkCarouselVisibility = async (dealerId: string): Promise<{
  inCarousel: boolean;
  details: string;
}> => {
  try {
    // Check if dealer appears in carousel data
    const response = await fetch('http://localhost:8000/api/dealers');
    if (!response.ok) {
      return {
        inCarousel: false,
        details: `Failed to fetch dealers: ${response.status}`
      };
    }
    
    const dealers = await response.json();
    const dealer = dealers.find((d: any) => d.id === dealerId);
    
    if (!dealer) {
      return {
        inCarousel: false,
        details: 'Dealer not found in database'
      };
    }

    const hasStage1Image = dealer.outfitStages?.[0]?.imageUrl;
    
    return {
      inCarousel: !!hasStage1Image,
      details: hasStage1Image ? 
        'Dealer has Stage 1 image and should appear in carousel' : 
        'Dealer missing Stage 1 image - won\'t appear in carousel'
    };
    
  } catch (error) {
    return {
      inCarousel: false,
      details: `Error checking carousel: ${error}`
    };
  }
};

// Add to window for easy console testing
if (typeof window !== 'undefined') {
  (window as any).uploadMonitor = {
    verifyImageUpload,
    checkCarouselVisibility,
    logUploadProgress
  };
} 