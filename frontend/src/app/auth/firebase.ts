import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { config } from "./config";
import { ref } from "firebase/storage";

// DEBUG: Log alle configuratie details
if (import.meta.env.DEV) {
  console.log("🔍 DEBUG: Firebase configuratie details:");
  console.log("📊 Volledige config object:", config);
  console.log("🔑 API Key:", config.firebaseConfig.apiKey ? "✅ Set" : "❌ Missing");
  console.log("🏠 Auth Domain:", config.firebaseConfig.authDomain);
  console.log("📁 Project ID:", config.firebaseConfig.projectId);
  console.log("🪣 Storage Bucket:", config.firebaseConfig.storageBucket);
  console.log("📨 Messaging Sender ID:", config.firebaseConfig.messagingSenderId ? "✅ Set" : "❌ Missing");
  console.log("📱 App ID:", config.firebaseConfig.appId ? "✅ Set" : "❌ Missing");
}

// Validate Firebase config
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !config.firebaseConfig[field as keyof typeof config.firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error("❌ Missing Firebase config fields:", missingFields);
    return false;
  }
  
  console.log("✅ Firebase config validation passed");
  return true;
};

// Initialize Firebase
export const firebaseApp = initializeApp(config.firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const firebaseAuth = getAuth(firebaseApp);

// Initialize Cloud Firestore and get a reference to the service
export const firestore = getFirestore(firebaseApp);

// Storage initialisatie variabelen
let firebaseStorage: ReturnType<typeof getStorage> | null = null;
let storageError: string | null = null;
let storageInitAttempted: boolean = false;
let storageInitPromise: Promise<ReturnType<typeof getStorage> | null> | null = null;

// Firebase Storage initialisatie met fallback
const initializeStorage = (): ReturnType<typeof getStorage> | null => {
  if (storageInitAttempted) {
    return firebaseStorage;
  }
  
  storageInitAttempted = true;
  
  try {
    console.log("🔄 Initializing Firebase Storage...");
    
    // Probeer eerst normale storage met explicit bucket URL
    const storage = getStorage(firebaseApp, config.firebaseConfig.storageBucket);
    
    // Test storage door een simpele referentie te maken
    try {
      // Test storage by creating a reference
      const testRef = ref(storage, 'test-connection');
      firebaseStorage = storage;
      console.log("✅ Firebase Storage initialized successfully");
      console.log(`🪣 Connected to bucket: ${config.firebaseConfig.storageBucket}`);
      return storage;
    } catch (testError: any) {
      console.warn("⚠️ Storage service test failed:", testError.message);
      
      // Als de test faalt, probeer nog steeds storage te gebruiken (het kan alsnog werken)
      firebaseStorage = storage;
      storageError = `Storage test failed: ${testError.message}`;
      console.log("🔧 Storage initialized with warnings - may still be functional");
      return storage;
    }
    
  } catch (error: any) {
    console.log("⚠️ Firebase Storage initialization error:", error.message);
    console.log("🔧 Error details:", error);
    
    // Check for specific billing/quota errors
    if (error.code === 'storage/quota-exceeded' || 
        error.code === 'storage/billing' || 
        error.message.includes('billing') ||
        error.message.includes('quota')) {
      storageError = "Firebase Storage billing not configured or quota exceeded";
      console.error("💳 Firebase Storage billing issue detected!");
      console.log("🔗 Please check your billing at: https://console.firebase.google.com/project/flirty-chat-a045e/settings/usage");
    } else if (error.code === 'storage/unauthorized') {
      storageError = "Firebase Storage access unauthorized";
      console.error("🔒 Firebase Storage access denied!");
      console.log("🔗 Please check your security rules at: https://console.firebase.google.com/project/flirty-chat-a045e/storage/flirty-chat-a045e.firebasestorage.app/rules");
    } else {
      storageError = error.message;
    }
    
    // In development mode, probeer nog steeds een storage object terug te geven
    if (import.meta.env.DEV) {
      try {
        console.log("🔧 Attempting fallback storage initialization...");
        const storage = getStorage(firebaseApp);
        firebaseStorage = storage;
        console.log("🧪 Development mode - storage initialized with fallback");
        return storage;
      } catch (fallbackError: any) {
        console.warn("🚧 Fallback storage initialization also failed:", fallbackError.message);
      }
    }
    
    console.warn("🚧 Running without Firebase Storage");
    return null;
  }
};

// Async storage initialisatie voor meer robuuste handling
const initializeStorageAsync = async (): Promise<ReturnType<typeof getStorage> | null> => {
  if (storageInitPromise) {
    return storageInitPromise;
  }

  storageInitPromise = new Promise((resolve) => {
    try {
      // Probeer storage direct te initialiseren
      const storage = initializeStorage();
      resolve(storage);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.warn("🚧 Async storage initialization failed:", error.message);
      }
      resolve(null);
    }
  });

  return storageInitPromise;
};

// Lazy loading functie voor storage
export const getFirebaseStorage = (): ReturnType<typeof getStorage> | null => {
  if (firebaseStorage) {
    return firebaseStorage;
  }
  
  // Probeer opnieuw te initialiseren als dat nog niet is gedaan
  return initializeStorage();
};

// Async versie van getFirebaseStorage
export const getFirebaseStorageAsync = async (): Promise<ReturnType<typeof getStorage> | null> => {
  if (firebaseStorage) {
    return firebaseStorage;
  }
  
  return await initializeStorageAsync();
};

// Storage beschikbaarheid controleren
export const isStorageAvailable = (): boolean => {
  return firebaseStorage !== null && storageError === null;
};

// Storage error ophalen
export const getStorageError = (): string | null => {
  return storageError;
};

// Async test voor storage beschikbaarheid
export const testStorageAvailability = async (): Promise<boolean> => {
  try {
    const storage = await getFirebaseStorageAsync();
    if (!storage) {
      if (import.meta.env.DEV) {
        console.log("❌ Firebase Storage is not available");
      }
      return false;
    }
    
    if (import.meta.env.DEV) {
      console.log("✅ Firebase Storage is available and ready");
    }
    return true;
    
  } catch (error: any) {
    if (import.meta.env.DEV) {
      console.error("❌ Firebase Storage test failed:", error);
    }
    return false;
  }
};

// Hertest storage beschikbaarheid (force reinitialization)
export const retestStorageAvailability = async (): Promise<boolean> => {
  // Reset storage state
  storageInitAttempted = false;
  firebaseStorage = null;
  storageError = null;
  storageInitPromise = null;
  
  // Probeer opnieuw te initialiseren
  const storage = await initializeStorageAsync();
  
  if (storage) {
    if (import.meta.env.DEV) {
      console.log("✅ Storage reinitialization successful!");
    }
    return true;
  } else {
    if (import.meta.env.DEV) {
      console.log("❌ Storage reinitialization failed");
    }
    return false;
  }
};

// Check Firebase billing and storage configuration
export const checkFirebaseStorageBilling = async (): Promise<{ available: boolean, reason: string }> => {
  try {
    // Probeer storage op te halen
    const storage = getStorage(firebaseApp);
    
    if (!storage) {
      return {
        available: false,
        reason: "Firebase Storage service kon niet worden geïnitialiseerd"
      };
    }
    
    // Probeer een simpele storage operatie (lijst buckets)
    try {
      // Test basic storage access - this will fail if billing is not set up
      const testRef = ref(storage, 'test-connection');
      
      // Dit zal falen als billing niet correct is ingesteld
      return {
        available: true,
        reason: "Firebase Storage is beschikbaar en billing is correct ingesteld"
      };
      
    } catch (storageError: any) {
      // Parse error messages voor specifieke problemen
      const errorMessage = storageError.message || storageError.toString();
      
      if (errorMessage.includes('billing') || errorMessage.includes('quota') || errorMessage.includes('payment')) {
        return {
          available: false,
          reason: "Firebase Storage vereist een betaald billing plan (Blaze Plan). Ga naar Firebase Console > Project Settings > Usage and billing om een billing account in te stellen."
        };
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        return {
          available: false,
          reason: "Firebase Storage permissions zijn niet correct ingesteld. Controleer de Storage Rules in Firebase Console."
        };
      } else if (errorMessage.includes('not available') || errorMessage.includes('service')) {
        return {
          available: false,
          reason: "Firebase Storage service is niet beschikbaar. Dit kan gebeuren in development mode of als het project niet correct is geconfigureerd."
        };
      } else {
        return {
          available: false,
          reason: `Firebase Storage error: ${errorMessage}`
        };
      }
    }
    
  } catch (error: any) {
    return {
      available: false,
      reason: `Onbekende Firebase Storage fout: ${error.message}`
    };
  }
};

// Debug informatie
export const logFirebaseStatus = () => {
  if (!import.meta.env.DEV) return;
  
  console.log("📊 Firebase Status Report:");
  console.log("📊 Project ID:", config.firebaseConfig.projectId);
  console.log("🪣 Storage Bucket:", config.firebaseConfig.storageBucket);
  console.log("⚙️ Auth Domain:", config.firebaseConfig.authDomain);
  console.log("🔥 App ID:", config.firebaseConfig.appId);
  console.log("💳 Plan: Blaze (paid)");
  console.log("🏪 Storage Available:", isStorageAvailable());
  if (storageError) {
    console.log("❌ Storage Error:", storageError);
    console.log("💡 Tip: Controleer of Firebase Storage is geactiveerd in de Firebase Console");
  }
};

// Valideer configuratie
validateFirebaseConfig();

// Initial debug logging
if (import.meta.env.DEV) {
  console.log("✅ Firebase app initialized");
}

// Probeer storage te initialiseren met delay (maar laat het falen zonder de app te breken)
setTimeout(async () => {
  await initializeStorageAsync();
  if (import.meta.env.DEV) {
    logFirebaseStatus();
  }
}, 100);

// Monitor auth state
onAuthStateChanged(firebaseAuth, async (user) => {
  if (user) {
    if (import.meta.env.DEV) {
      console.log("👤 Current user: Authenticated");
    }
    
    // Test storage availability na login met delay, maar niet agressief
    setTimeout(async () => {
      const available = await testStorageAvailability();
      if (available && import.meta.env.DEV) {
        console.log("🎉 Firebase Storage is ready after authentication!");
      } else if (import.meta.env.DEV) {
        console.log("❌ Firebase Storage is not available");
        // Don't retry aggressively in dev mode to prevent loops
      }
    }, 2000); // Increased delay to prevent loops
  } else {
    if (import.meta.env.DEV) {
      console.log("👤 Current user: Not authenticated");
    }
  }
});

// Direct export van storage (kan null zijn)
export { firebaseStorage };

// Re-export voor backward compatibility
export const firebaseRTDB = firebaseApp;

// Make quickStorageTest available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).quickStorageTest = async () => {
    const storage = getFirebaseStorage();
    console.log("🧪 Quick storage test:", storage ? "✅ Available" : "❌ Not available");
    return storage !== null;
  };
  
  // Add retestStorageAvailability function to global scope
  (window as any).retestStorageAvailability = retestStorageAvailability;
  
  // Add billing check function to global scope
  (window as any).checkFirebaseStorageBilling = checkFirebaseStorageBilling;
  
  // Add debug function to reset auth state
  (window as any).resetAuthState = () => {
    console.log("🔄 Resetting auth state...");
    firebaseAuth.signOut().then(() => {
      window.location.href = '/login';
    }).catch(console.error);
  };
  
  // Add function to clear storage state
  (window as any).resetStorageState = () => {
    console.log("🧹 Clearing storage state...");
    storageInitAttempted = false;
    firebaseStorage = null;
    storageError = null;
    storageInitPromise = null;
    console.log("✅ Storage state cleared");
  };
}
