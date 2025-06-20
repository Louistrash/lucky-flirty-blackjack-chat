import React, { useState, useEffect } from "react";
import { firebaseAuth, firestore } from "../app/auth/firebase";
import { setupAdminUsers, checkUserAdmin } from "../utils/setupAdminUsers";
import { doc, setDoc } from "firebase/firestore";

export const AdminSetup: React.FC = () => {
  const [status, setStatus] = useState<string>("Waiting for authentication...");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        setStatus(`Authenticated as: ${user.email} (UID: ${user.uid})`);
        
        // Check if user is already admin
        try {
          const adminStatus = await checkUserAdmin();
          setIsAdmin(adminStatus);
          if (adminStatus) {
            setStatus(`✅ You are already an admin! UID: ${user.uid}, Email: ${user.email}`);
          } else {
            setStatus(`⚠️ Not an admin yet. UID: ${user.uid}, Email: ${user.email}`);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setStatus(`❌ Error checking admin status: ${error}`);
        }
      } else {
        setCurrentUser(null);
        setStatus("❌ Not authenticated - please log in first");
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSetupAdmin = async () => {
    if (!currentUser) {
      setStatus("❌ Please log in first");
      return;
    }

    setIsProcessing(true);
    setStatus("🔄 Setting up admin access...");

    try {
      // First set the admin status in Firestore
      const adminDoc = doc(firestore, "admin_users", currentUser.uid);
      await setDoc(adminDoc, {
        uid: currentUser.uid,
        email: currentUser.email,
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log("✅ Admin document created in Firestore");
      setStatus("✅ Admin document created in Firestore");

      // Wait a moment for Firestore to sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Now run the full admin setup
      await setupAdminUsers();
      
      // Verify admin status
      const adminStatus = await checkUserAdmin();
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        setStatus(`🎉 SUCCESS! You are now an admin! You can access /dealer-management`);
      } else {
        setStatus(`⚠️ Admin setup completed but verification failed. Try refreshing the page.`);
      }
      
    } catch (error: any) {
      console.error("Admin setup failed:", error);
      setStatus(`❌ Setup failed: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckAdminStatus = async () => {
    if (!currentUser) {
      setStatus("❌ Please log in first");
      return;
    }

    setIsProcessing(true);
    try {
      const adminStatus = await checkUserAdmin();
      setIsAdmin(adminStatus);
      setStatus(adminStatus 
        ? `✅ You are an admin! UID: ${currentUser.uid}` 
        : `❌ You are not an admin. UID: ${currentUser.uid}`
      );
    } catch (error: any) {
      setStatus(`❌ Error checking admin status: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6">🔧 Admin Setup</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Current Status:</h3>
        <div className="bg-gray-900 p-4 rounded border border-gray-600">
          <p className="text-gray-300 whitespace-pre-wrap">{status}</p>
        </div>
      </div>

      {currentUser && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">User Information:</h3>
          <div className="bg-gray-900 p-4 rounded border border-gray-600">
            <p className="text-gray-300">📧 Email: {currentUser.email}</p>
            <p className="text-gray-300">🆔 UID: {currentUser.uid}</p>
            <p className="text-gray-300">✅ Verified: {currentUser.emailVerified ? "Yes" : "No"}</p>
            <p className="text-gray-300">👑 Admin: {isAdmin ? "Yes" : "No"}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {!isAdmin && currentUser && (
          <button
            onClick={handleSetupAdmin}
            disabled={isProcessing}
            className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isProcessing ? "⏳ Setting up..." : "🚀 Setup Admin Access"}
          </button>
        )}

        <button
          onClick={handleCheckAdminStatus}
          disabled={isProcessing || !currentUser}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {isProcessing ? "⏳ Checking..." : "🔍 Check Admin Status"}
        </button>

        {isAdmin && (
          <div className="mt-4 p-4 bg-green-900 border border-green-600 rounded-lg">
            <h4 className="text-green-400 font-bold mb-2">🎉 Admin Access Confirmed!</h4>
            <p className="text-green-300 mb-3">You now have admin privileges. You can:</p>
            <ul className="text-green-300 list-disc list-inside space-y-1">
              <li>Access <a href="/dealer-management" className="text-green-200 underline">/dealer-management</a></li>
              <li>Access <a href="/admin-page" className="text-green-200 underline">/admin-page</a></li>
              <li>Manage dealers and system settings</li>
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-900 border border-blue-600 rounded-lg">
        <h4 className="text-blue-400 font-bold mb-2">ℹ️ Instructions:</h4>
        <ol className="text-blue-300 list-decimal list-inside space-y-1">
          <li>Make sure you're logged in with your admin account</li>
          <li>Click "Setup Admin Access" to grant yourself admin privileges</li>
          <li>Wait for the setup to complete</li>
          <li>Navigate to /dealer-management to verify access</li>
        </ol>
      </div>
    </div>
  );
}; 