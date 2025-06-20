import { useEffect, useState, useCallback } from 'react';
import { useCurrentUser } from 'app';
import { usePlayerProgressStore } from './usePlayerProgressStore';
import { firebaseAuth, firestore } from '../app/auth/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface UserOnboardingStatus {
  isNewUser: boolean;
  isOnboarding: boolean;
  hasCompletedOnboarding: boolean;
}

export const useUserOnboarding = () => {
  const { user } = useCurrentUser();
  const { updatePlayerCoins, playerData } = usePlayerProgressStore();
  const [onboardingStatus, setOnboardingStatus] = useState<UserOnboardingStatus>({
    isNewUser: false,
    isOnboarding: false,
    hasCompletedOnboarding: false
  });

  useEffect(() => {
    const handleUserOnboarding = async () => {
      if (!user?.uid) return;

      try {
        setOnboardingStatus(prev => ({ ...prev, isOnboarding: true }));

        // Check if user profile exists
        const userProfileRef = doc(firestore, 'userProfiles', user.uid);
        const userProfileSnap = await getDoc(userProfileRef);

        if (!userProfileSnap.exists()) {
          // New user! Set up profile and give premium status + 1000 coins
          console.log('🎉 New user detected! Setting up premium account...');
          
          const newUserProfile = {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName || 'Player',
            userType: 'premium', // New users get premium!
            premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days premium
            registrationDate: serverTimestamp(),
            hasCompletedOnboarding: false,
            initialCoinsGiven: false,
            totalWins: 0,
            totalCoinsEarned: 0,
            achievements: ['Premium Member'],
            unlockedDealers: [], // Array of dealer IDs they've unlocked
            settings: {
              notifications: true,
              sound: true,
              theme: 'dark'
            }
          };

          // Save user profile
          await setDoc(userProfileRef, newUserProfile);

          console.log('✅ New user onboarding flow initiated!');
          
          setOnboardingStatus({
            isNewUser: true,
            isOnboarding: false,
            hasCompletedOnboarding: false
          });

          // Show welcome message
          // setTimeout(() => {
          //   alert('🎉 Welkom bij Lucky Flirty Chat!\n\n✨ Je hebt automatisch Premium status gekregen!\n💰 Je hebt 1000 gratis coins ontvangen!\n🎰 Je kunt nu spelen, chatten en dealer outfits unlocken!\n\nVeel plezier!');
          // }, 1000);

        } else {
          // Existing user
          const userData = userProfileSnap.data();
          setOnboardingStatus({
            isNewUser: false,
            isOnboarding: false,
            hasCompletedOnboarding: userData.hasCompletedOnboarding || false
          });
        }

      } catch (error) {
        console.error('Error during user onboarding:', error);
        setOnboardingStatus(prev => ({ ...prev, isOnboarding: false }));
      }
    };

    handleUserOnboarding();
  }, [user]);

  const completeOnboarding = useCallback(async (userId: string) => {
    if (!userId) return;
    try {
      const userProfileRef = doc(firestore, 'userProfiles', userId);
      await updateDoc(userProfileRef, {
        hasCompletedOnboarding: true,
        initialCoinsGiven: true,
        totalCoinsEarned: 1000,
        achievements: ['Premium Member', 'Welcome Bonus']
      });
      setOnboardingStatus(prev => ({ ...prev, hasCompletedOnboarding: true }));
      console.log('✅ Onboarding marked as complete for user:', userId);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }, []);

  const unlockDealerImage = async (dealerId: string, cost: number = 200) => {
    if (!user?.uid || !playerData) return { success: false, message: 'Gebruiker niet ingelogd' };

    if (playerData.playerCoins < cost) {
      return { success: false, message: 'Niet genoeg coins om te unlocken' };
    }

    try {
      // Deduct coins
      await updatePlayerCoins(user.uid, -cost);

      // Update user profile with unlocked dealer
      const userProfileRef = doc(firestore, 'userProfiles', user.uid);
      const userProfileSnap = await getDoc(userProfileRef);
      
      if (userProfileSnap.exists()) {
        const userData = userProfileSnap.data();
        const unlockedDealers = userData.unlockedDealers || [];
        
        if (!unlockedDealers.includes(dealerId)) {
          await setDoc(userProfileRef, {
            ...userData,
            unlockedDealers: [...unlockedDealers, dealerId]
          }, { merge: true });
        }
      }

      return { success: true, message: 'Dealer image unlocked!' };
    } catch (error) {
      console.error('Error unlocking dealer image:', error);
      return { success: false, message: 'Er ging iets mis bij het unlocken' };
    }
  };

  const getUserProfile = async () => {
    if (!user?.uid) return null;

    try {
      const userProfileRef = doc(firestore, 'userProfiles', user.uid);
      const userProfileSnap = await getDoc(userProfileRef);
      
      if (userProfileSnap.exists()) {
        return userProfileSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  return {
    onboardingStatus,
    completeOnboarding,
    unlockDealerImage,
    getUserProfile
  };
}; 