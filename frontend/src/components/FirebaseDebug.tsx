import React, { useState, useEffect } from 'react';
import { completeFirebaseSetup, testFirebaseStorageConnectivity, setupAdminUsers, checkUserAdmin } from '../utils/setupAdminUsers';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firebaseAuth, isStorageAvailable } from '../app/auth/firebase';
import { auth } from '../app/auth/auth';

export const FirebaseDebug: React.FC = () => {
  const [user, loading, error] = useAuthState(auth);
  const [testResults, setTestResults] = useState<{
    storageWorking?: boolean;
    adminSetup?: boolean;
    error?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [storageStatus, setStorageStatus] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingAdmin, setCheckingAdmin] = useState<boolean>(true);

  useEffect(() => {
    // Check storage availability on component mount
    setStorageStatus(isStorageAvailable());
  }, []);

  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        setCheckingAdmin(true);
        try {
          const adminStatus = await checkUserAdmin();
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        } finally {
          setCheckingAdmin(false);
        }
      } else {
        setIsAdmin(false);
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleCompleteSetup = async () => {
    setIsLoading(true);
    try {
      const results = await completeFirebaseSetup();
      setTestResults(results);
    } catch (error) {
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestStorage = async () => {
    setIsLoading(true);
    try {
      await testFirebaseStorageConnectivity();
      setTestResults(prev => ({ ...prev, storageWorking: true }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        storageWorking: false,
        error: error instanceof Error ? error.message : 'Storage test failed' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupAdmins = async () => {
    try {
      await setupAdminUsers();
      // Refresh admin status after setup
      setTimeout(async () => {
        const adminStatus = await checkUserAdmin();
        setIsAdmin(adminStatus);
      }, 1000);
    } catch (error) {
      console.error("Setup admin failed:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-2xl font-bold mb-6">🔧 Firebase Debug & Admin Setup</h2>
      
      {/* Authentication Status */}
      <div className="mb-6 p-4 border border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-400">👤 Authentication Status</h3>
        
        {loading && <p className="text-yellow-400">⏳ Checking authentication...</p>}
        {error && <p className="text-red-400">❌ Auth Error: {error.message}</p>}
        
        {!loading && (
          <div className="space-y-2">
            {user ? (
              <div className="text-green-400">
                <p>✅ <strong>Ingelogd als:</strong> {user.email}</p>
                <p>🆔 <strong>UID:</strong> {user.uid}</p>
                <p>📧 <strong>Email Verified:</strong> {user.emailVerified ? '✅ Yes' : '❌ No'}</p>
                
                {checkingAdmin ? (
                  <p className="text-yellow-400">⏳ Checking admin status...</p>
                ) : (
                  <p className={isAdmin ? "text-green-400" : "text-gray-400"}>
                    👑 <strong>Admin Status:</strong> {isAdmin ? '✅ Admin' : '❌ Not Admin'}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-red-400">
                <p>❌ <strong>Niet ingelogd</strong></p>
                <p>🔗 Ga naar de login pagina om in te loggen</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin Setup Section */}
      <div className="mb-6 p-4 border border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-red-400">🛡️ Admin Setup</h3>
        
        {!user ? (
          <div className="text-yellow-400">
            <p>⚠️ Je moet eerst inloggen voordat je admin rechten kunt instellen</p>
            <p>📝 Ga naar de login pagina en log in met patricknieborg@me.com of infoappsnl@gmail.com</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-300 mb-3">
              Dit zet admin rechten op voor de volgende accounts:
            </p>
            <ul className="text-gray-400 mb-4 list-disc list-inside">
              <li>infoappsnl@gmail.com</li>
              <li>patricknieborg@me.com</li>
            </ul>
            
            {isAdmin ? (
              <p className="text-green-400 mb-3">✅ Je hebt al admin rechten!</p>
            ) : (
              <p className="text-yellow-400 mb-3">⚠️ Je hebt nog geen admin rechten</p>
            )}
            
            <button
              onClick={handleSetupAdmins}
              disabled={loading || checkingAdmin}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              {loading || checkingAdmin ? '⏳ Loading...' : '🛡️ Setup Admin Users Only'}
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 p-4 bg-white rounded border">
        <h3 className="font-semibold mb-2">Firebase Storage Status:</h3>
        <p className={`${storageStatus ? 'text-green-600' : 'text-red-600'}`}>
          <strong>Storage Available:</strong> {storageStatus ? '✅ Yes' : '❌ No'}
        </p>
        {!storageStatus && (
          <p className="text-sm text-gray-600 mt-1">
            Storage is not available. Check console for details.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={handleCompleteSetup}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? 'Running...' : 'Complete Firebase Setup'}
        </button>

        <button
          onClick={handleTestStorage}
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? 'Testing...' : 'Test Storage Only'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="mt-6 p-4 bg-white rounded border">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          {testResults.storageWorking !== undefined && (
            <p className={`mb-2 ${testResults.storageWorking ? 'text-green-600' : 'text-red-600'}`}>
              <strong>Storage:</strong> {testResults.storageWorking ? '✅ Working' : '❌ Failed'}
            </p>
          )}
          {testResults.adminSetup !== undefined && (
            <p className={`mb-2 ${testResults.adminSetup ? 'text-green-600' : 'text-red-600'}`}>
              <strong>Admin Setup:</strong> {testResults.adminSetup ? '✅ Complete' : '❌ Failed'}
            </p>
          )}
          {testResults.error && (
            <p className="text-red-600">
              <strong>Error:</strong> {testResults.error}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
        <h3 className="font-semibold mb-2 text-yellow-800">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Make sure you're logged in as an admin user</li>
          <li>Check if Firebase Storage is available above</li>
          <li>Click "Complete Firebase Setup" to test everything</li>
          <li>Check the browser console for detailed logs</li>
          <li>If storage fails, check Firebase console for proper configuration</li>
        </ol>
      </div>
    </div>
  );
}; 