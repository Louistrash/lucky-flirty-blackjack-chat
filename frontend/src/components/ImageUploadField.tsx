import React, { useState, useRef } from 'react';
import { uploadImageWithUserFeedback } from '../utils/adminDealerManager';
import { formatFileSize, optimizeImage } from '../utils/localImageStorage';

interface ImageUploadFieldProps {
  label: string;
  currentImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
  uploadPath: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  className?: string;
  disabled?: boolean;
}

// Helper component to display image URLs in a user-friendly way
const ImageUrlDisplay: React.FC<{ url: string; storageMethod: 'firebase' | 'local' | null }> = ({ url, storageMethod }) => {
  if (!url) return null;
  
  const isFirebase = url.startsWith('https://firebasestorage.googleapis.com');
  const isBase64 = url.startsWith('data:image/');
  
  if (isFirebase) {
    const shortUrl = url.length > 60 ? url.substring(0, 60) + '...' : url;
    return (
      <div className="text-xs text-green-300 bg-green-900/20 p-2 rounded mt-2">
        <div className="font-medium">🔗 Firebase Storage URL:</div>
        <div className="font-mono break-all">{shortUrl}</div>
      </div>
    );
  } else if (isBase64) {
    const sizeKB = Math.round(url.length * 0.75 / 1024);
    const sizeColor = sizeKB > 100 ? 'text-yellow-300' : sizeKB > 50 ? 'text-orange-300' : 'text-green-300';
    const bgColor = sizeKB > 100 ? 'bg-yellow-900/20' : sizeKB > 50 ? 'bg-orange-900/20' : 'bg-green-900/20';
    
    return (
      <div className={`text-xs ${sizeColor} ${bgColor} p-2 rounded mt-2`}>
        <div className="font-medium">💾 Local Storage (Base64):</div>
        <div>Size: {sizeKB}KB</div>
        {sizeKB > 100 && (
          <div className="text-yellow-200 mt-1">
            ⚠️ Large file - Firebase Storage recommended
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="text-xs text-blue-300 bg-blue-900/20 p-2 rounded mt-2">
        <div className="font-medium">🌐 External URL:</div>
        <div className="font-mono break-all">{url.length > 60 ? url.substring(0, 60) + '...' : url}</div>
      </div>
    );
  }
};

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  currentImageUrl,
  onImageChange,
  uploadPath,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8,
  className = "",
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [storageMethod, setStorageMethod] = useState<'firebase' | 'local' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadStatus("❌ Selecteer alleen afbeeldingen");
      setTimeout(() => setUploadStatus(""), 3000);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus("❌ Afbeelding is te groot (max 10MB)");
      setTimeout(() => setUploadStatus(""), 3000);
      return;
    }

    setIsUploading(true);
    setUploadStatus("🔄 Optimizing image...");

    try {
      // First optimize the image for better quality and smaller size
      const optimizedBase64 = await optimizeImage(file, maxWidth, quality);
      setPreview(optimizedBase64);
      
      // Convert back to file for Firebase Storage upload
      const optimizedFile = await base64ToFile(optimizedBase64, file.name);
      
      setUploadStatus("📤 Uploading image...");
      
      // Upload using our enhanced upload system
      const { url, method } = await uploadImageWithUserFeedback(uploadPath, optimizedFile);
      
      // Update the image URL
      onImageChange(url);
      setStorageMethod(method);
      
      if (method === 'firebase') {
        setUploadStatus("✅ Uploaded to Firebase Storage");
      } else {
        // For local storage, show size info
        const sizeKB = Math.round(url.length * 0.75 / 1024);
        if (sizeKB > 100) {
          setUploadStatus(`⚠️ Large local file (${sizeKB}KB) - Consider Firebase upgrade`);
        } else {
          setUploadStatus(`✅ Compressed locally (${sizeKB}KB)`);
        }
      }
      
      setTimeout(() => setUploadStatus(""), 5000);
      
    } catch (error) {
      console.error('Image upload failed:', error);
      setUploadStatus("❌ Upload gefaald, probeer opnieuw");
      setTimeout(() => setUploadStatus(""), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  const base64ToFile = async (base64: string, filename: string): Promise<File> => {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAreaClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      
      {/* Upload Area */}
      <div 
        onClick={handleAreaClick}
        className={`
          relative border-2 border-dashed rounded-lg overflow-hidden
          ${disabled ? 'border-gray-600 cursor-not-allowed' : 'border-gray-500 hover:border-amber-400 cursor-pointer'}
          transition-colors duration-200
        `}
      >
        {preview ? (
          // Image Preview
          <div className="relative group">
            <img 
              src={preview} 
              alt={label}
              className="w-full h-48 object-cover"
              onError={(e) => {
                console.error('Image load error:', e);
                setPreview(null);
              }}
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAreaClick();
                  }}
                  disabled={disabled || isUploading}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  disabled={disabled || isUploading}
                  className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Upload Placeholder
          <div className="h-48 flex flex-col items-center justify-center text-gray-400">
            {isUploading ? (
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="text-sm">Uploading...</div>
              </div>
            ) : (
              <div className="text-center">
                <svg className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="text-sm mb-1">Click to upload image</div>
                <div className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Status Message */}
      {uploadStatus && (
        <div className={`text-sm p-2 rounded ${
          uploadStatus.includes('❌') ? 'bg-red-900/30 text-red-400' :
          uploadStatus.includes('✅') ? 'bg-green-900/30 text-green-400' :
          'bg-blue-900/30 text-blue-400'
        }`}>
          {uploadStatus}
        </div>
      )}
      
      {/* Storage Method Info */}
      {storageMethod === 'local' && (
        <div className="text-xs text-amber-400 bg-amber-900/20 p-2 rounded">
          💾 Locally compressed - Firebase Storage requires Blaze plan
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Image URL Display */}
      <ImageUrlDisplay url={currentImageUrl || ""} storageMethod={storageMethod} />
    </div>
  );
};

export default ImageUploadField; 