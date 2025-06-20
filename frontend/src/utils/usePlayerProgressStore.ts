import { create } from 'zustand';
import { doc, onSnapshot, setDoc, updateDoc, increment, getDoc, getFirestore } from 'firebase/firestore';
import { firebaseApp } from 'app'; // Assuming db is initialized firebaseApp from firebase auth extension
import { dealers, getDealerById, OutfitStage } from './dealerData'; // To access winsToUnlock, coinsToUnlock

const db = getFirestore(firebaseApp);

// --- Interfaces ---
export interface PlayerDealerProgress {
  currentOutfitStageIndex: number;
  winsWithDealer: number;
  gamesPlayedWithDealer: number;
}

export interface PlayerData {
  userId: string; // Keep userId also in the data for convenience
  playerCoins: number;
  dealerProgress: { [dealerId: string]: PlayerDealerProgress };
}

interface PlayerProgressState {
  playerData: PlayerData | null;
  isLoading: boolean;
  error: Error | null;
  subscribeToPlayerProgress: (userId: string) => () => void; // Returns unsubscribe function
  recordWinForProgression: (userId: string, dealerId: string) => Promise<void>; // Renamed
  unlockOutfitWithCoins: (userId: string, dealerId: string, stageToUnlockIndex: number) => Promise<void>;
  updatePlayerCoins: (userId: string, amountChange: number) => Promise<void>; // Added for explicit coin updates
  initializePlayerData: (userId: string) => Promise<PlayerData>;
  syncWithUserProfile: (userId: string) => () => void; // Returns unsubscribe function
  recordGamePlayed: (userId: string, dealerId: string) => Promise<void>;
}

// --- Initial State & Helper for New Player ---
const getInitialDealerProgress = (): { [dealerId: string]: PlayerDealerProgress } => {
  const progress: { [dealerId: string]: PlayerDealerProgress } = {};
  dealers.forEach(dealer => {
    progress[dealer.id] = {
      currentOutfitStageIndex: 0, // Start at the first outfit
      winsWithDealer: 0,
      gamesPlayedWithDealer: 0,
    };
  });
  return progress;
};

const initialPlayerData = (userId: string): PlayerData => ({
  userId: userId,
  playerCoins: 0, // Starting coins for a new player - they get 1000 from onboarding bonus
  dealerProgress: getInitialDealerProgress(),
});


// --- Zustand Store Definition ---
export const usePlayerProgressStore = create<PlayerProgressState>((set, get) => ({
  playerData: null,
  isLoading: true,
  error: null,

  initializePlayerData: async (userId: string): Promise<PlayerData> => {
    const playerDocRef = doc(db, 'playerData', userId);
    const newPlayerData = initialPlayerData(userId);
    try {
      await setDoc(playerDocRef, newPlayerData, { merge: true }); // Use merge if doc might partially exist
      console.log(`Player data initialized/updated for ${userId}`);
      return newPlayerData;
    } catch (e) {
      console.error("Error initializing player data:", e);
      throw e; // Rethrow to be caught by caller
    }
  },

  subscribeToPlayerProgress: (userId) => {
    set({ isLoading: true, error: null });
    const playerDocRef = doc(db, 'playerData', userId);

    const unsubscribe = onSnapshot(playerDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          set({ playerData: { userId, ...docSnap.data() } as PlayerData, isLoading: false });
        } else {
          console.log(`Player data for ${userId} not found. Initializing...`);
          try {
            const newPlayerData = await get().initializePlayerData(userId);
            set({ playerData: newPlayerData, isLoading: false });
          } catch (e) {
            console.error("Error initializing player data after not found:", e);
            set({ error: e as Error, isLoading: false });
          }
        }
      },
      (err) => {
        console.error("Error subscribing to player progress:", err);
        set({ error: err, isLoading: false });
      }
    );
    return unsubscribe; // Return the unsubscribe function for cleanup
  },

  syncWithUserProfile: (userId) => {
    const userProfileRef = doc(db, 'userProfiles', userId);
    const unsubscribe = onSnapshot(userProfileRef, async (docSnap) => {
      if (docSnap.exists()) {
        const userProfile = docSnap.data();
        const coinsFromProfile = userProfile.totalCoinsEarned || 0;
        
        const currentPlayerData = get().playerData;
        // Only sync if we have a significant difference and playerData exists
        if (currentPlayerData && Math.abs(currentPlayerData.playerCoins - coinsFromProfile) > 0) {
          console.log(`🔄 Syncing coins from profile: ${currentPlayerData.playerCoins} -> ${coinsFromProfile}`);
          
          // Update playerData document to match profile
          const playerDocRef = doc(db, 'playerData', userId);
          try {
            await updateDoc(playerDocRef, {
              playerCoins: coinsFromProfile
            });
          } catch (error) {
            console.error("Error syncing playerData with profile:", error);
          }
        }
      }
    });
    return unsubscribe;
  },

  recordWinForProgression: async (userId, dealerId) => {
    const playerDocRef = doc(db, 'playerData', userId);
    const userProfileRef = doc(db, 'userProfiles', userId); // Also get user profile ref
    const currentPlayerData = get().playerData;
    if (!currentPlayerData) {
      console.error("Player data not loaded yet for recordWinForProgression");
      return;
    }
    const dealer = getDealerById(dealerId);
    if (!dealer) {
      console.error(`Dealer ${dealerId} not found in dealerData.ts`);
      return;
    }

    const currentProgress = currentPlayerData.dealerProgress[dealerId] || { currentOutfitStageIndex: 0, winsWithDealer: 0 };
    const newWinsWithDealer = currentProgress.winsWithDealer + 1;

    const updates: any = {
      [`dealerProgress.${dealerId}.winsWithDealer`]: increment(1),
    };
    
    // Also update total wins in the user profile
    const profileUpdates: any = {
      totalWins: increment(1),
      totalGamesPlayed: increment(1),
    };
    
    const currentOutfitStageIndex = currentProgress.currentOutfitStageIndex;
    const nextOutfitStageIndex = currentOutfitStageIndex + 1;

    if (nextOutfitStageIndex < dealer.outfitStages.length) {
      const nextOutfit = dealer.outfitStages[nextOutfitStageIndex];
      if (nextOutfit.winsToUnlock > 0 && newWinsWithDealer >= nextOutfit.winsToUnlock) {
        if (currentOutfitStageIndex < nextOutfitStageIndex) {
             updates[`dealerProgress.${dealerId}.currentOutfitStageIndex`] = nextOutfitStageIndex;
             console.log(`Player ${userId} unlocked ${nextOutfit.name} for ${dealer.name} by wins!`);
        }
      }
    }
    
    try {
      await updateDoc(playerDocRef, updates);
      await updateDoc(userProfileRef, profileUpdates); // Update profile as well
      console.log(`Win recorded for progression for ${userId} with ${dealerId}.`);
    } catch (error) {
      console.error("Error recording win for progression:", error);
    }
  },

  recordGamePlayed: async (userId, dealerId) => {
    const playerDocRef = doc(db, 'playerData', userId);
    try {
      await updateDoc(playerDocRef, {
        [`dealerProgress.${dealerId}.gamesPlayedWithDealer`]: increment(1),
      });
    } catch (error) {
      console.error(`Error recording game played for dealer ${dealerId}:`, error);
    }
  },

  updatePlayerCoins: async (userId, amountChange) => {
    const playerDocRef = doc(db, 'playerData', userId);
    const userProfileRef = doc(db, 'userProfiles', userId);
    try {
      // Always update profile first as it's the source of truth for coins
      await updateDoc(userProfileRef, {
        totalCoinsEarned: increment(amountChange),
      });
      
      // Then update playerData to match
      await updateDoc(playerDocRef, {
        playerCoins: increment(amountChange),
      });

      console.log(`💰 Player coins updated for ${userId} by ${amountChange}.`);
    } catch (error) {
      console.error("Error updating player coins:", error);
      // If player document doesn't exist, this will fail. Consider initializing if not found.
      const docSnap = await getDoc(playerDocRef);
      if (!docSnap.exists()) {
        console.log("Player document not found while trying to update coins. Initializing...");
        await get().initializePlayerData(userId); // Initialize first
        // Get current profile coins to sync properly
        const profileSnap = await getDoc(userProfileRef);
        const currentProfileCoins = profileSnap.exists() ? (profileSnap.data().totalCoinsEarned || 0) : 0;
        await updateDoc(playerDocRef, { playerCoins: currentProfileCoins + amountChange });
        await updateDoc(userProfileRef, { totalCoinsEarned: increment(amountChange) });
      }
    }
  },

  unlockOutfitWithCoins: async (userId, dealerId, stageToUnlockIndex) => {
    const playerDocRef = doc(db, 'playerData', userId);
    const currentPlayerData = get().playerData;

    if (!currentPlayerData) {
      console.error("Player data not loaded yet for unlockOutfitWithCoins");
      return;
    }

    const coinsNeeded = 100; // Fixed price of 100 coins per outfit
    
    if (currentPlayerData.playerCoins < coinsNeeded) {
      console.log(`Player ${userId} does not have enough coins to unlock stage ${stageToUnlockIndex}. Needs ${coinsNeeded}, has ${currentPlayerData.playerCoins}`);
      return; 
    }

    if (currentPlayerData.dealerProgress[dealerId]?.currentOutfitStageIndex >= stageToUnlockIndex) {
      console.log(`Player ${userId} already has stage ${stageToUnlockIndex} or higher unlocked for ${dealerId}.`);
      return;
    }
    
    try {
      // Update both documents
      await updateDoc(playerDocRef, {
        playerCoins: increment(-coinsNeeded),
        [`dealerProgress.${dealerId}.currentOutfitStageIndex`]: stageToUnlockIndex,
      });
      console.log(`Player ${userId} unlocked stage ${stageToUnlockIndex} for ${dealerId} with ${coinsNeeded} coins.`);
    } catch (error) {
      console.error("Error unlocking outfit with coins:", error);
      throw error; // Re-throw to handle in UI
    }
  },
}));
