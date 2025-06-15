import React, { useEffect, useState, startTransition } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCurrentUser } from "app";
import { getDealers } from "utils/adminDealerManager";
import DealerCarousel from "../components/DealerCarousel";
import { AppHeader } from "../components/AppHeader";
import { getActiveDealers } from "../utils/dummyDealerData";
import { validateDealerForCarrousel } from "../utils/dealerUtils";
import { DealerData } from "../utils/adminDealerManager";
import { firebaseApp } from "../app";
import { getFirestore } from "firebase/firestore";
import { auth } from "../app/auth/auth";
import { useUserOnboarding } from "../utils/useUserOnboarding";
import WelcomeModal from "../components/WelcomeModal";
import { usePlayerProgressStore } from "../utils/usePlayerProgressStore";
import { useTranslation } from "react-i18next";

// Initialize Firestore to ensure it's available for getDealers
getFirestore(firebaseApp);

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user: currentUser } = useCurrentUser();
  const [dealers, setDealers] = useState<DealerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingDummyData, setUsingDummyData] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { onboardingStatus, completeOnboarding } = useUserOnboarding();
  const activeDummyDealers = getActiveDealers();
  const { 
    playerData, 
    subscribeToPlayerProgress,
    syncWithUserProfile 
  } = usePlayerProgressStore();

  // Subscribe to player progress
  useEffect(() => {
    if (currentUser?.uid) {
      const unsubscribeProgress = subscribeToPlayerProgress(currentUser.uid);
      const unsubscribeProfile = syncWithUserProfile(currentUser.uid);
      
      return () => {
        unsubscribeProgress();
        unsubscribeProfile();
      };
    }
  }, [currentUser, subscribeToPlayerProgress, syncWithUserProfile]);

  // Get playerBalance directly from store
  const playerBalance = playerData?.playerCoins ?? 0;

  const loadDealers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // EERST: Probeer live dealers van Firebase te laden
      console.log("🔥 Attempting to load live dealers from Firebase...");
      try {
        const dealersData = await getDealers();
        
        if (dealersData && dealersData.length > 0) {
          const validDealers = dealersData.filter(dealer => {
            const validation = validateDealerForCarrousel(dealer);
            return validation.isValid;
          });

          if (validDealers.length > 0) {
            console.log(`✅ SUCCESS: Loaded ${validDealers.length} live dealers from Firebase!`);
            startTransition(() => {
              setDealers(validDealers);
              setUsingDummyData(false);
              setError(null);
            });
            return;
          } else {
            console.log("⚠️ No valid dealers found in Firebase, falling back to demo...");
          }
        } else {
          console.log("⚠️ No dealers found in Firebase, falling back to demo...");
        }
      } catch (firebaseErr) {
        console.log("⚠️ Firebase error, falling back to demo dealers:", firebaseErr);
      }

      // BACKUP: Demo dealers als Firebase faalt
      console.log("🎰 Loading demo dealers as fallback...");
      const demoData = getActiveDealers();
      const validDemoData = demoData.filter(dealer => {
        const validation = validateDealerForCarrousel(dealer);
        return validation.isValid;
      });
      
      if (validDemoData.length > 0) {
        startTransition(() => {
          setDealers(validDemoData);
          setUsingDummyData(true);
          setError(null);
        });
        return;
      }

      // EMERGENCY: Als alles faalt, minimale dealer
      startTransition(() => {
        setDealers([{
          id: 'emergency-dealer',
          name: 'Casino Dealer',
          title: 'Professionele Dealer',
          isActive: true,
          avatarUrl: '/logo-blackjack-royal.png',
          experience: 3
        }]);
        setUsingDummyData(true);
        setError(null);
      });

    } catch (err) {
      console.error("❌ Error loading dealers:", err);
      
      // Emergency fallback - altijd minimaal 1 dealer tonen
      startTransition(() => {
        setDealers([{
          id: 'emergency-dealer',
          name: 'Casino Dealer',
          title: 'Professionele Dealer',
          isActive: true,
          avatarUrl: '/logo-blackjack-royal.png',
          experience: 3
        }]);
        setUsingDummyData(true);
        setError(null);
      });
    } finally {
      startTransition(() => {
        setIsLoading(false);
      });
    }
  };

  // Load dealers on component mount
  useEffect(() => {
    loadDealers();
  }, []);

  useEffect(() => {
    if (onboardingStatus.isNewUser && !onboardingStatus.hasCompletedOnboarding) {
      setShowWelcomeModal(true);
    }
  }, [onboardingStatus.isNewUser, onboardingStatus.hasCompletedOnboarding]);

  // Expose refresh function globally for easy access
  useEffect(() => {
    (window as any).refreshCarousel = loadDealers;
    (window as any).refreshDealers = loadDealers;
    
    // Add debug function to force backend dealer loading
    (window as any).forceBackendDealers = async () => {
      console.log("🔧 DEBUG: Force loading dealers from backend...");
      try {
        const backendDealers = await getDealers();
        console.log(`Found ${backendDealers.length} backend dealers:`, backendDealers.map(d => `${d.name} (${d.id})`));
        
        const activeDealer = backendDealers.filter(d => d.isActive);
        console.log(`${activeDealer.length} active dealers:`, activeDealer.map(d => d.name));
        
        // Force set dealers to backend data
        setDealers(activeDealer);
        setUsingDummyData(false);
        
        console.log("✅ FORCED: Now using backend dealers");
        return activeDealer;
      } catch (error) {
        console.error("❌ Failed to force backend dealers:", error);
        return null;
      }
    };
    
    // Add Firebase Storage test function
    (window as any).testFirebaseStorage = async () => {
      try {
        const { retestStorageAvailability } = await import('../app/auth/firebase');
        console.log("🔥 Testing Firebase Storage connectivity...");
        const result = await retestStorageAvailability();
        if (result) {
          console.log("✅ SUCCESS: Firebase Storage is working! Blaze plan detected.");
          console.log("🎉 You can now upload images directly to Firebase Storage!");
        } else {
          console.log("❌ Firebase Storage not available - check your billing plan");
          console.log("💡 The app will continue to work with local base64 storage");
        }
        return result;
      } catch (error) {
        console.error("Storage test failed:", error);
        return false;
      }
    };
    
    // Add dealer refresh notification
    (window as any).notifyDealerUpdated = (dealerId: string) => {
      console.log(`🔄 Dealer ${dealerId} updated - refreshing carousel...`);
      loadDealers();
    };
    
    return () => {
      delete (window as any).refreshCarousel;
      delete (window as any).refreshDealers;
      delete (window as any).forceBackendDealers;
      delete (window as any).testFirebaseStorage;
      delete (window as any).notifyDealerUpdated;
    };
  }, []);

  const handleSelectDealer = (dealerId: string) => {
    // Als gebruiker niet ingelogd is, doorsturen naar login
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // Anders normale flow naar game
    navigate(`/game/${dealerId}`);
  };

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    // The welcome bonus and onboarding completion is now handled in the hook
    if (currentUser?.uid && onboardingStatus.isNewUser) {
      console.log('✅ Closing welcome modal and finalizing onboarding...');
      completeOnboarding(currentUser.uid);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex flex-col relative overflow-x-hidden pt-14 sm:pt-16">
      
      {/* Luxe Casino Background Effects - Vereenvoudigd met alleen casino pattern */}
      <div className="absolute inset-0 z-0">
        
        {/* Casino Pattern Image - Direct gebruik van de pattern */}
        <div 
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage: 'url(/casino-pattern.png)',
            backgroundSize: '300px 300px',
            backgroundRepeat: 'repeat',
            backgroundBlendMode: 'overlay'
          }}
        ></div>

        {/* Casino Table Felt Pattern - Basis felt textuur */}
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              rgba(34, 197, 94, 0.08) 0px,
              rgba(34, 197, 94, 0.08) 1px,
              transparent 1px,
              transparent 24px
            )
          `,
          backgroundSize: '48px 48px'
        }}></div>
        
        {/* Luxury Casino Glow - Subtiel */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/12 via-transparent to-yellow-900/12"></div>
        
        {/* Deep Vignette Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/40"></div>
      </div>

      <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseWelcomeModal} />

      {/* Standardized AppHeader with language selector, coins counter etc. */}
      <AppHeader 
        title={t('app.title', 'Lucky Flirty Chat')} 
        showHomeButton={false}
        playerBalance={playerBalance}
        showBackButton={false}
      />

      {/* Welcome Banner for Authenticated Users */}
      {currentUser && (
        <div className="relative z-20 bg-gradient-to-r from-emerald-900/40 via-green-900/50 to-emerald-900/40 border-y border-emerald-400/30 py-4 mb-8">
          <div className="container mx-auto px-6 text-center">
            <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">🎰</span>
                </div>
                <div className="text-left">
                  <h3 className="text-emerald-300 font-bold text-lg">{t('app.welcome.title', 'Welcome to Lucky Flirty Chat!')}</h3>
                  <p className="text-emerald-200/70 text-sm">{t('app.welcome.subtitle', 'Choose a dealer and start playing')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Login Banner for Non-Authenticated Users */}
      {!currentUser && (
        <div className="relative z-20 bg-gradient-to-r from-amber-900/40 via-yellow-900/50 to-amber-900/40 border-y border-amber-400/30 py-6 mb-8">
          <div className="container mx-auto px-6 text-center">
            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">🔐</span>
                </div>
                <div className="text-left">
                  <h3 className="text-amber-300 font-bold">{t('app.exclusiveAccess', 'Exclusive Access')}</h3>
                  <p className="text-amber-200/70 text-sm">{t('app.loginForPremium', 'Log in to access all premium features')}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-amber-500/30 transform hover:scale-105"
              >
                {t('app.premiumAccess', 'Premium Access')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content area that scrolls */}
      <main className="flex-grow overflow-y-auto">
        <div className="container mx-auto px-4 overflow-x-hidden">
          <div className="carousel-wrapper">
            <DealerCarousel 
              dealers={dealers} 
              onSelectDealer={handleSelectDealer} 
              isLoading={isLoading}
              error={error}
              playerData={playerData}
            />
          </div>
        </div>
        
        {/* Welcome Banner for New Users - Only show briefly after onboarding */}
        {onboardingStatus.isNewUser && onboardingStatus.hasCompletedOnboarding && showWelcomeModal && (
          <div className="text-center mt-12">
            <div className="inline-flex items-center bg-gradient-to-r from-purple-900/60 to-pink-900/60 backdrop-blur-sm border border-purple-400/30 rounded-2xl px-8 py-6 text-purple-200 shadow-2xl">
              <span className="text-4xl mr-6">🎉</span>
              <div className="text-left">
                <h3 className="font-bold text-purple-300 mb-2 text-xl">{t('app.welcome.premium.title', 'Welcome Premium Member!')}</h3>
                <p className="text-purple-200/80">{t('app.welcome.premium.subtitle', 'You have received 1000 free coins to start playing!')}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Enhanced Footer with Casino Pattern */}
      <footer className="relative z-20 overflow-hidden casino-footer-pattern bg-black/70 backdrop-blur-xl">
        {/* Casino Pattern Background */}
        <div className="absolute inset-0">
          {/* Main casino pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url(/casino-pattern.png)',
              backgroundSize: '120px 120px',
              backgroundRepeat: 'repeat',
              backgroundBlendMode: 'overlay'
            }}
          ></div>
          
          {/* Black, glossy overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90"></div>
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent"></div>
          
          {/* Elegant border */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
        </div>
        
        {/* Footer Content */}
        {/* De bg-transparent en backdrop-blur-sm hier kunnen weg als de parent footer dit al doet */}
        <div className="relative z-10 py-8 border-t border-amber-400/20"> {/* Iets minder padding dan py-12 */}
          <div className="container mx-auto px-6 text-center">
            {/* Legal info and new text */}
            <div>
              <p className="text-slate-300 text-sm">
                {t('app.footer.legal', '© 2024 Elite Blackjack. Play responsibly 18+')}
              </p>
              <p className="text-slate-400 text-xs mt-2">
                {t('app.footer.tagline', 'Premium Casino Experience with AI Powered Blackjack Chat')}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
