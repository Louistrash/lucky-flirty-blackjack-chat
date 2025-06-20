import React, { useState, useEffect } from 'react';
import { isStorageAvailable, getFirebaseStorage, retestStorageAvailability } from '../app/auth/firebase';
import { uploadImageWithFallback, optimizeImage, formatFileSize, estimateBase64Size } from '../utils/localImageStorage';
import { uploadImageWithUserFeedback } from '../utils/adminDealerManager';

// Add global test function for easy browser console testing
declare global {
  interface Window {
    testFirebaseStorage: () => Promise<void>;
    retestStorage: () => Promise<void>;
  }
}

export const StorageDebugPanel: React.FC = () => {
  const [storageStatus, setStorageStatus] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRetesting, setIsRetesting] = useState(false);

  useEffect(() => {
    // Check storage availability on component mount
    setStorageStatus(isStorageAvailable());
    
    // Add global test functions to window object
    window.testFirebaseStorage = async () => {
      console.log("🔥 Testing Firebase Storage connectivity...");
      try {
        const available = await retestStorageAvailability();
        console.log(`📊 Storage Status: ${available ? '✅ Available' : '❌ Not Available'}`);
        setStorageStatus(available);
        return available;
      } catch (error) {
        console.error("❌ Storage test failed:", error);
        throw error;
      }
    };

    window.retestStorage = async () => {
      console.log("🔄 Retesting storage availability...");
      const result = await handleRetestStorage();
      return result;
    };
    
    // Cleanup function
    return () => {
      delete window.testFirebaseStorage;
      delete window.retestStorage;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleRetestStorage = async () => {
    setIsRetesting(true);
    addTestResult('storage-test', 'Retesting Firebase Storage availability...', true);
    
    try {
      const available = await retestStorageAvailability();
      setStorageStatus(available);
      addTestResult('storage-test', 
        `Storage retest completed: ${available ? 'Available ✅' : 'Not Available ❌'}`, 
        available
      );
      return available;
    } catch (error) {
      console.error('Storage retest failed:', error);
      addTestResult('error', `Storage retest failed: ${error}`, false);
      throw error;
    } finally {
      setIsRetesting(false);
    }
  };

  const testImageOptimization = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      const originalSize = selectedFile.size;
      const optimizedDataUrl = await optimizeImage(selectedFile, 600, 0.7);
      const optimizedSize = estimateBase64Size(optimizedDataUrl);
      
      const result = {
        type: 'optimization',
        originalSize: formatFileSize(originalSize),
        optimizedSize: formatFileSize(optimizedSize),
        compressionRatio: `${Math.round((1 - optimizedSize / originalSize) * 100)}%`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setTestResults(prev => [result, ...prev]);
    } catch (error) {
      setTestResults(prev => [{
        type: 'error',
        message: `Optimization failed: ${error}`,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const testUploadWithFallback = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      const { url, method } = await uploadImageWithUserFeedback(
        `test/debug-${Date.now()}-${selectedFile.name}`,
        selectedFile
      );
      
      const isBase64 = url.startsWith('data:image/');
      const result = {
        type: 'upload',
        method,
        isBase64,
        urlLength: url.length,
        urlPreview: isBase64 ? `${url.substring(0, 50)}...` : url,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setTestResults(prev => [result, ...prev]);
    } catch (error) {
      setTestResults(prev => [{
        type: 'error',
        message: `Upload failed: ${error}`,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const addTestResult = (type: string, message: string, success: boolean) => {
    const result = {
      type,
      success,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev]);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-md max-w-4xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6 text-amber-400">Storage Debug Panel</h2>
      
      {/* Storage Status */}
      <div className="mb-6 p-4 bg-gray-700 rounded border">
        <h3 className="font-semibold mb-2 text-yellow-300">Firebase Storage Status:</h3>
        <p className={`${storageStatus ? 'text-green-400' : 'text-red-400'} font-medium`}>
          <strong>Storage Available:</strong> {storageStatus ? '✅ Yes' : '❌ No (Expected on Spark plan)'}
        </p>
        {!storageStatus && (
          <p className="text-sm text-gray-300 mt-2">
            💡 This is normal for free Firebase projects. The app uses local storage as fallback.
          </p>
        )}
        <div className="mt-3">
          <button
            onClick={handleRetestStorage}
            disabled={isRetesting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white font-medium rounded-md transition-colors"
          >
            {isRetesting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Testing...
              </>
            ) : (
              <>
                🔄 Retest Storage
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            Click this if you just activated the Blaze plan
          </p>
        </div>
      </div>

      {/* File Input */}
      <div className="mb-6 p-4 bg-gray-700 rounded border">
        <h3 className="font-semibold mb-3 text-yellow-300">Test Image Upload:</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-3 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-amber-900 hover:file:bg-amber-600"
        />
        
        {previewUrl && (
          <div className="mb-3">
            <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md border border-gray-600" />
            <p className="text-xs text-gray-400 mt-1">
              Original size: {selectedFile ? formatFileSize(selectedFile.size) : 'Unknown'}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={testImageOptimization}
            disabled={!selectedFile || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-medium rounded-md transition-colors"
          >
            Test Optimization
          </button>
          <button
            onClick={testUploadWithFallback}
            disabled={!selectedFile || isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-medium rounded-md transition-colors"
          >
            Test Upload
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="mb-6 p-4 bg-gray-700 rounded border">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-yellow-300">Test Results:</h3>
          <button
            onClick={clearResults}
            disabled={testResults.length === 0}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white text-sm rounded-md transition-colors"
          >
            Clear
          </button>
        </div>
        
        {testResults.length === 0 ? (
          <p className="text-gray-400 text-sm">No test results yet</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {testResults.map((result, index) => (
              <div key={index} className="p-3 bg-gray-600 rounded border-l-4 border-l-blue-400">
                <div className="flex justify-between items-start mb-2">
                  <span className={`font-medium ${
                    result.type === 'error' ? 'text-red-400' : 
                    result.type === 'optimization' ? 'text-blue-400' : 
                    result.type === 'storage-test' ? (result.success ? 'text-green-400' : 'text-orange-400') :
                    'text-green-400'
                  }`}>
                    {result.type.toUpperCase().replace('-', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{result.timestamp}</span>
                </div>
                
                {result.type === 'optimization' && (
                  <div className="text-sm text-gray-200">
                    <p>Original: {result.originalSize} → Optimized: {result.optimizedSize}</p>
                    <p>Compression: {result.compressionRatio}</p>
                  </div>
                )}
                
                {result.type === 'storage-test' && (
                  <div className="text-sm text-gray-200">
                    <p className={result.success ? 'text-green-300' : 'text-orange-300'}>
                      {result.message}
                    </p>
                  </div>
                )}
                
                {result.type === 'upload' && (
                  <div className="text-sm text-gray-200">
                    <p>Method: <span className="font-medium">{result.method}</span></p>
                    <p>Format: {result.isBase64 ? 'Base64 (Local)' : 'URL (Firebase)'}</p>
                    <p>URL: <code className="text-xs bg-gray-800 px-1 rounded">{result.urlPreview}</code></p>
                  </div>
                )}
                
                {result.type === 'error' && (
                  <p className="text-sm text-red-300">{result.message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 bg-amber-900/20 rounded border border-amber-600/30">
        <h3 className="font-semibold mb-2 text-amber-400">ℹ️ Information:</h3>
        <ul className="text-sm text-amber-200 space-y-1">
          <li>• Firebase Storage requires the Blaze (pay-as-you-go) plan since October 2024</li>
          <li>• This app uses optimized base64 storage in Firestore as fallback</li>
          <li>• Images are automatically resized to max 600px and compressed</li>
          <li>• Local storage works well for small to medium sized images</li>
          <li>• Use the "Retest Storage" button if you just activated Blaze plan</li>
        </ul>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg border border-amber-400/50">
            <div className="flex items-center">
              <svg className="animate-spin h-6 w-6 text-amber-400 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-amber-400 font-medium">Processing...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 