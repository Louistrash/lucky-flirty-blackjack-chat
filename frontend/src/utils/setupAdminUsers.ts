import { doc, setDoc, getDoc } from "firebase/firestore";
import { firestore, getFirebaseStorage, isStorageAvailable, retestStorageAvailability, firebaseAuth } from "../app/auth/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { uploadImageWithFallback } from "./localImageStorage";
import { onAuthStateChanged } from "firebase/auth";

// Admin user IDs from auth-config.json
const ADMIN_USERS = [
  {
    uid: "75Aq10RIleblof15ukHN9dCv6Lp2", // infoappsnl@gmail.com
    email: "infoappsnl@gmail.com",
    isAdmin: true
  },
  {
    uid: "xX87l4sYzQUZaCPiXyvLVTESC1g1", // patricknieborg@me.com
    email: "patricknieborg@me.com",
    isAdmin: true
  }
];

/**
 * Tests Firebase Storage connectivity with detailed logging
 */
export const testFirebaseStorageConnectivity = async (): Promise<void> => {
  console.log("🧪 ===========================================");
  console.log("🧪 FIREBASE STORAGE CONNECTIVITY TEST");
  console.log("🧪 ===========================================");
  
  try {
    // Test 1: Basic Storage Instance
    console.log("📦 Test 1: Creating Storage instance...");
    const storage = getFirebaseStorage();
    if (!storage) {
      throw new Error("Failed to get storage instance");
    }
    console.log("✅ Storage instance created successfully");
    
    // Test 2: Storage Availability Check
    console.log("🔍 Test 2: Checking storage availability...");
    const available = await retestStorageAvailability();
    console.log(`📊 Storage Available: ${available ? '✅ YES' : '❌ NO'}`);
    
    // Test 3: Create Test File
    console.log("📄 Test 3: Creating test file...");
    const testData = new Blob(['Firebase Storage Test - ' + new Date().toISOString()], { type: 'text/plain' });
    const testFile = new File([testData], 'storage-test.txt', { type: 'text/plain' });
    
    // Test 4: Upload Test
    console.log("⬆️ Test 4: Testing upload...");
    const testPath = `test/connectivity-test-${Date.now()}.txt`;
    
    if (available) {
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const testRef = ref(storage, testPath);
      
      console.log(`📁 Upload path: ${testPath}`);
      const snapshot = await uploadBytes(testRef, testFile);
      console.log("✅ Upload successful!");
      
      // Test 5: Download URL
      console.log("🔗 Test 5: Getting download URL...");
      const downloadURL = await getDownloadURL(testRef);
      console.log("✅ Download URL generated:", downloadURL);
      
      console.log("🎉 ===========================================");
      console.log("🎉 ALL TESTS PASSED! Firebase Storage is working!");
      console.log("🎉 ===========================================");
    } else {
      console.log("⚠️ Using fallback storage (expected on Spark plan)");
      const fallbackResult = await uploadImageWithFallback(testPath, testFile, true);
      console.log("✅ Fallback storage test successful:", fallbackResult.substring(0, 50) + "...");
      
      console.log("ℹ️ ===========================================");
      console.log("ℹ️ FALLBACK STORAGE WORKING (Firebase not available)");
      console.log("ℹ️ ===========================================");
    }
    
  } catch (error) {
    console.error("❌ ===========================================");
    console.error("❌ STORAGE TEST FAILED");
    console.error("❌ ===========================================");
    console.error("Error details:", error);
    throw error;
  }
};

// Add to window for easy console access
declare global {
  interface Window {
    testStorageConnectivity: () => Promise<void>;
  }
}

// Auto-add to window when module loads
if (typeof window !== 'undefined') {
  window.testStorageConnectivity = testFirebaseStorageConnectivity;
}

/**
 * Quick storage test that can be called from browser console
 */
export const quickStorageTest = async () => {
  console.log("🚀 Starting quick Firebase Storage test...");
  
  try {
    // Importeer beide functies
    const { retestStorageAvailability, checkFirebaseStorageBilling } = await import('../app/auth/firebase');
    
    // Eerst een billing check
    console.log("💳 Checking Firebase Storage billing status...");
    const billingCheck = await checkFirebaseStorageBilling();
    
    console.log(`💳 Billing Status: ${billingCheck.available ? '✅ OK' : '❌ Issue'}`);
    console.log(`💳 Details: ${billingCheck.reason}`);
    
    // Dan proberen storage te reinitialiseren
    console.log("🔄 Testing storage availability...");
    const result = await retestStorageAvailability();
    
    if (result) {
      console.log("✅ SUCCESS: Firebase Storage is working! Blaze plan detected.");
      console.log("🎉 You can now upload images directly to Firebase Storage!");
    } else {
      console.log("❌ Firebase Storage not available");
      
      if (!billingCheck.available) {
        console.log("💡 OPLOSSING: " + billingCheck.reason);
        console.log("💡 Voor nu werkt de app met lokale base64 image opslag");
      } else {
        console.log("💡 The app will continue to work with local base64 storage");
      }
    }
    
    return result;
  } catch (error) {
    console.error("❌ Storage test failed:", error);
    console.log("💡 De app blijft werken met lokale image opslag");
    return false;
  }
};

// Make quickStorageTest available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).quickStorageTest = quickStorageTest;
  
  // Add admin check function to window for easy debugging
  (window as any).checkMyAdminStatus = async () => {
    console.log("🔍 ===========================================");
    console.log("🔍 ADMIN STATUS DEBUG CHECK");
    console.log("🔍 ===========================================");
    
    const isAdmin = await checkUserAdmin();
    
    console.log("🔍 ===========================================");
    console.log(`🔍 FINAL RESULT: ${isAdmin ? '✅ YOU ARE ADMIN' : '❌ NOT ADMIN'}`);
    console.log("🔍 ===========================================");
    
    return isAdmin;
  };
  
  // Add manual admin setup function
  (window as any).manualAdminSetup = async () => {
    console.log("🔧 ===========================================");
    console.log("🔧 MANUAL ADMIN SETUP");
    console.log("🔧 ===========================================");
    
    try {
      await setupAdminUsers();
      console.log("✅ Manual admin setup completed");
      return true;
    } catch (error) {
      console.error("❌ Manual admin setup failed:", error);
      return false;
    }
  };
  
  // Add manual dealer seeding function
  (window as any).seedDealersToFirestore = async () => {
    console.log("👥 ===========================================");
    console.log("👥 SEED DEALERS TO FIRESTORE");
    console.log("👥 ===========================================");
    
    try {
      const { seedDummyDealers } = await import('./adminDealerManager');
      const result = await seedDummyDealers();
      console.log("✅ Dealers seeded successfully:", result);
      console.log(`📊 Added: ${result.added}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`);
      if (result.errors.length > 0) {
        console.warn("❌ Errors:", result.errors);
      }
      return result;
    } catch (error) {
      console.error("❌ Failed to seed dealers:", error);
      return false;
    }
  };
  
  // Add dealer check function
  (window as any).checkDealersInFirestore = async () => {
    console.log("👥 ===========================================");
    console.log("👥 CHECK DEALERS IN FIRESTORE");
    console.log("👥 ===========================================");
    
    try {
      const { getDealers } = await import('./adminDealerManager');
      const dealers = await getDealers();
      console.log(`📊 Found ${dealers.length} dealers in Firestore:`);
      dealers.forEach(dealer => {
        console.log(`  - ${dealer.name} (${dealer.id}) - ${dealer.isActive ? 'Active' : 'Inactive'}`);
      });
      return dealers;
    } catch (error) {
      console.error("❌ Failed to check dealers:", error);
      return [];
    }
  };
}

// Wait for auth state to be ready
function waitForAuth(): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Auth timeout - user not logged in"));
    }, 10000); // 10 second timeout

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      if (user) {
        console.log("✅ User authenticated:", user.email, "UID:", user.uid);
        resolve(user);
      } else {
        reject(new Error("User not logged in to Firebase"));
      }
    });
  });
}

/**
 * Adds admin users to the admin_users collection in Firestore
 */
export async function setupAdminUsers(): Promise<void> {
  try {
    console.log("Setting up admin users...");
    
    // Wait for authentication state
    const currentUser = await waitForAuth();
    
    if (!currentUser) {
      throw new Error("❌ Je moet eerst inloggen voordat je admin rechten kunt instellen. Ga naar de login pagina en log in met je account.");
    }

    console.log("✅ Authenticated user found:", currentUser.email, "UID:", currentUser.uid);

    // Check if current user is in the allowed admin list
    const isAllowedAdmin = ADMIN_USERS.some(admin => admin.uid === currentUser.uid);
    
    if (!isAllowedAdmin) {
      throw new Error(`❌ Je account (${currentUser.email}) staat niet in de lijst van toegestane admin accounts. Alleen infoappsnl@gmail.com en patricknieborg@me.com kunnen admin rechten instellen.`);
    }

    console.log("✅ User is authorized to setup admin rights");

    // Set up all admin users
    for (const admin of ADMIN_USERS) {
      try {
        await setDoc(doc(firestore, "admin_users", admin.uid), {
          email: admin.email,
          isAdmin: true,
          createdAt: new Date(),
          role: "admin",
          setupBy: currentUser.email,
          setupAt: new Date()
        });
        console.log(`✅ Admin setup completed for: ${admin.email}`);
      } catch (adminError) {
        console.error(`❌ Failed to setup admin for ${admin.email}:`, adminError);
        throw new Error(`Failed to setup admin for ${admin.email}: ${adminError.message}`);
      }
    }

    alert("🎉 Admin setup voltooid! Je hebt nu admin rechten. Refresh de pagina om je nieuwe rechten te activeren.");
    
  } catch (error) {
    console.error("❌ Error setting up admin users:", error);
    
    // Show user-friendly error messages
    if (error.message.includes("timeout") || error.message.includes("not logged in")) {
      alert("❌ Je bent niet ingelogd! Log eerst in met je account voordat je admin rechten instelt.");
    } else if (error.message.includes("niet in de lijst")) {
      alert(error.message);
    } else if (error.message.includes("permission")) {
      alert("❌ Firestore permissions error. Controleer of de Firestore rules correct zijn ingesteld.");
    } else {
      alert(`❌ Er is een fout opgetreden: ${error.message}`);
    }
    
    throw error;
  }
}

// Check if current user is admin
export async function checkUserAdmin(): Promise<boolean> {
  try {
    const currentUser = await waitForAuth();
    
    if (!currentUser) {
      console.log("🔍 Admin check: No user authenticated");
      return false;
    }

    console.log(`🔍 Admin check: Checking user ${currentUser.email} (UID: ${currentUser.uid})`);
    
    // Check if user is in hardcoded admin list first
    const isHardcodedAdmin = ADMIN_USERS.some(admin => admin.uid === currentUser.uid);
    console.log(`🔍 Admin check: Found ${isHardcodedAdmin ? '✅' : '❌'} in hardcoded admin list`);
    
    return isHardcodedAdmin;
  } catch (error) {
    console.error("❌ Admin check failed:", error);
    return false;
  }
}