// Backend Upload Utility
// Uses the backend API for Firebase Storage uploads

const BACKEND_URL = 'http://localhost:8000';

/**
 * Upload file via backend API
 */
export const uploadFileViaBackend = async (file: File, folder: string = 'uploads'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const response = await fetch(`${BACKEND_URL}/api/firebase-storage/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ File uploaded via backend:', result.file_url);
      return result.file_url;
    } else {
      throw new Error(result.message || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ Backend upload failed:', error);
    throw error;
  }
};

/**
 * Check backend Firebase Storage health
 */
export const checkBackendStorageHealth = async (): Promise<{status: string, firebase_available: boolean}> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/firebase-storage/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    throw error;
  }
};

/**
 * Upload image with backend Firebase Storage
 * This function uses the backend API which has working Firebase credentials
 */
export const uploadImageViaBackend = async (
  path: string,
  file: File
): Promise<string> => {
  try {
    // Extract folder from path (e.g., "dealers/frederique_001" from "dealers/frederique_001/image.jpg")
    const folder = path.split('/').slice(0, -1).join('/') || 'uploads';
    
    console.log(`🔄 Uploading via backend to folder: ${folder}`);
    return await uploadFileViaBackend(file, folder);
  } catch (error) {
    console.error('❌ Backend image upload failed:', error);
    
    // Fallback to base64 if backend fails
    console.log('🔄 Falling back to base64 storage');
    const { optimizeImage } = await import('./localImageStorage');
    return await optimizeImage(file, 600, 0.7);
  }
}; 