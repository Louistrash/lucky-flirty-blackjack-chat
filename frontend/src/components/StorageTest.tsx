import React, { useState } from 'react';
import { testStorageAvailability, getFirebaseStorage, isStorageAvailable } from '../app/auth/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const StorageTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testStorageConnectivity = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult("🔄 Testing Firebase Storage connectivity...");
      
      const available = await testStorageAvailability();
      
      if (available) {
        addResult("✅ Storage connectivity test passed!");
        await testFileUpload();
      } else {
        addResult("❌ Storage connectivity test failed");
      }
    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFileUpload = async () => {
    try {
      addResult("🔄 Testing file upload...");
      
      const storage = getFirebaseStorage();
      if (!storage) {
        addResult("❌ Storage not available");
        return;
      }

      // Create a test file
      const testContent = new Blob(['Hello Firebase Storage!'], { type: 'text/plain' });
      const testRef = ref(storage, `test/test-${Date.now()}.txt`);
      
      // Upload the file
      await uploadBytes(testRef, testContent);
      addResult("✅ File upload successful!");
      
      // Get download URL
      const downloadURL = await getDownloadURL(testRef);
      addResult(`✅ Download URL obtained: ${downloadURL.substring(0, 50)}...`);
      
    } catch (error: any) {
      addResult(`❌ Upload failed: ${error.code} - ${error.message}`);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-600">
      <h3 className="text-xl font-bold text-white mb-4">🔥 Firebase Storage Test</h3>
      
      <div className="mb-4">
        <p className="text-slate-300">
          Status: {isStorageAvailable() ? '✅ Available' : '❌ Not Available'}
        </p>
      </div>

      <button
        onClick={testStorageConnectivity}
        disabled={isLoading}
        className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 text-white px-4 py-2 rounded mb-4"
      >
        {isLoading ? '🔄 Testing...' : '🧪 Test Storage'}
      </button>

      <div className="bg-slate-900 p-4 rounded max-h-64 overflow-y-auto">
        <h4 className="text-white font-semibold mb-2">Test Results:</h4>
        {testResults.length === 0 ? (
          <p className="text-slate-400">No tests run yet</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="text-sm text-slate-300 mb-1 font-mono">
              {result}
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 