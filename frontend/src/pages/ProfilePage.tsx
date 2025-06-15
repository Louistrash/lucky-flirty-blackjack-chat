import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../app/auth/useCurrentUser";
import { usePlayerProgressStore } from "../utils/usePlayerProgressStore";
import { isAdminUser } from "../utils/adminDealerManager";
import { auth } from "../app/auth/auth";
import { useUserOnboarding } from "../utils/useUserOnboarding";
import { AppHeader } from "../components/AppHeader";
import { useTranslation } from "react-i18next";

// User Types
type UserType = 'free' | 'premium' | 'admin';

interface UserProfile {
  userType: UserType;
  subscriptionExpiry?: Date;
  totalWins: number;
  totalCoinsEarned: number;
  favoriteDealer?: string;
  achievements: string[];
  unlockedDealers: string[];
}

interface TokenDeal {
  id: string;
  name: string;
  coins: number;
  price: number;
  originalPrice?: number;
  popular?: boolean;
  bonus?: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useCurrentUser();
  const playerData = usePlayerProgressStore(state => state.playerData);
  const subscribeToPlayerProgress = usePlayerProgressStore(state => state.subscribeToPlayerProgress);
  const updatePlayerCoins = usePlayerProgressStore(state => state.updatePlayerCoins);
  const playerProgressLoading = usePlayerProgressStore(state => state.isLoading);
  const { onboardingStatus, unlockDealerImage, getUserProfile } = useUserOnboarding();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<UserType>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'tokens' | 'dealers' | 'achievements' | 'admin'>('profile');
  const [purchaseStatus, setPurchaseStatus] = useState<{ [key: string]: 'idle' | 'processing' | 'success' | 'error' }>({});

  const tokenDeals: TokenDeal[] = [
    {
      id: 'starter',
      name: t('profile.tokenDeals.starter.name', 'Starter Pack'),
      coins: 500,
      price: 5.00,
      bonus: t('profile.tokenDeals.starter.bonus', 'Perfect to get started')
    },
    {
      id: 'popular',
      name: t('profile.tokenDeals.popular.name', 'Popular Choice'),
      coins: 1200,
      price: 10.00,
      originalPrice: 12.00,
      popular: true,
      bonus: t('profile.tokenDeals.popular.bonus', '+20% Bonus Coins!')
    },
    {
      id: 'value',
      name: t('profile.tokenDeals.value.name', 'Value Bundle'),
      coins: 2500,
      price: 20.00,
      originalPrice: 25.00,
      bonus: t('profile.tokenDeals.value.bonus', 'Best Value Per Coin')
    },
    {
      id: 'premium',
      name: t('profile.tokenDeals.premium.name', 'Premium Stash'),
      coins: 6500,
      price: 50.00,
      originalPrice: 70.00,
      bonus: t('profile.tokenDeals.premium.bonus', 'Huge Bonus + VIP Tag')
    },
    {
      id: 'whale',
      name: t('profile.tokenDeals.whale.name', 'Whale Package'),
      coins: 15000,
      price: 100.00,
      originalPrice: 150.00,
      bonus: t('profile.tokenDeals.whale.bonus', 'The Ultimate Experience')
    }
  ];

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupSubscriptions = async () => {
      if (user?.uid) {
        // Store the unsubscribe function returned by subscribeToPlayerProgress
        unsubscribe = subscribeToPlayerProgress(user.uid);
        
        try {
          const profile = await getUserProfile();
          setUserProfile(profile as UserProfile | null);
          // Determine user type based on profile or admin status
          if (await isAdminUser(user.uid)) {
            setUserType('admin');
          } else if (profile?.userType === 'premium') { // Assuming 'premium' is stored in profile
            setUserType('premium');
          } else {
            setUserType('free');
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserType('free'); // Default to free if profile fetch fails
        }
        setIsLoading(false);
      };
      fetchProfile();
    };

    setupSubscriptions();

    // Cleanup function to unsubscribe when component unmounts or user changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]); // Only depend on user.uid, other dependencies are stable

  const handlePurchaseTokens = async (deal: TokenDeal) => {
    if (!user?.uid) return;
    setPurchaseStatus(prev => ({ ...prev, [deal.id]: 'processing' }));
    try {
      // Simulate API call for purchase
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      await updatePlayerCoins(user.uid, (playerData?.playerCoins || 0) + deal.coins);
      setPurchaseStatus(prev => ({ ...prev, [deal.id]: 'success' }));
      setTimeout(() => setPurchaseStatus(prev => ({ ...prev, [deal.id]: 'idle' })), 3000);
    } catch (error) {
      console.error("Error purchasing tokens:", error);
      setPurchaseStatus(prev => ({ ...prev, [deal.id]: 'error' }));
      setTimeout(() => setPurchaseStatus(prev => ({ ...prev, [deal.id]: 'idle' })), 3000);
    }
  };

  const handleUnlockDealer = async (dealerId: string) => {
    if (!user?.uid) return;
    try {
      await unlockDealerImage(dealerId);
      // Refresh profile or specific part if needed
    } catch (error) {
      console.error(`Error unlocking dealer ${dealerId}:`, error);
    }
  };

  const getUserTypeBadge = (type: UserType) => {
    switch (type) {
      case 'admin':
        return { text: t('profile.userType.admin', 'Admin'), color: 'bg-red-600', icon: '👑' };
      case 'premium':
        return { text: t('profile.userType.premium', 'Premium'), color: 'bg-purple-600', icon: '⭐' };
      default:
        return { text: t('profile.userType.free', 'Free'), color: 'bg-slate-600', icon: '👤' };
    }
  };

  const patternBackground = {
    backgroundImage: 'url(/casino-pattern.png)',
    backgroundSize: '300px 300px',
    backgroundRepeat: 'repeat',
    backgroundBlendMode: 'overlay'
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">{t('profile.pleaseLogin', 'Please log in to view your profile.')}</div>
      </div>
    );
  }

  if (isLoading || playerProgressLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">{t('profile.loading', 'Loading profile...')}</div>
      </div>
    );
  }

  const userBadge = getUserTypeBadge(userType);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 relative">
      <div 
        className="absolute inset-0 opacity-10 z-0"
        style={patternBackground}
      ></div>
      
      <AppHeader 
        title={t('profile.title', 'Your Profile')} 
        showBackButton={true}
        backTo="/"
        playerBalance={playerData?.playerCoins || 0} 
      />
      
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header Card */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-amber-400/20 p-6 mb-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-3xl font-bold text-slate-900 ring-4 ring-slate-700">
                  {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'P'}
                </div>
                <div className={`absolute -bottom-2 -right-2 ${userBadge.color} px-2 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-md`}>
                  <span>{userBadge.icon}</span>
                  <span>{userBadge.text}</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-1">
                  {user?.displayName || t('profile.defaultPlayerName', 'Player')}
                </h2>
                <p className="text-slate-400 mb-3 text-sm">{user?.email}</p>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {playerData?.playerCoins || 0} <span className="text-lg">💰</span>
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">{t('profile.stats.coins', 'Coins')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {userProfile?.totalWins || 0}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">{t('profile.stats.wins', 'Wins')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {userProfile?.achievements?.length || 0}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">{t('profile.stats.achievements', 'Achievements')}</div>
                  </div>
                </div>
              </div>

              {userType === 'free' && (
                <div className="text-center md:text-right mt-4 md:mt-0">
                  <button 
                    onClick={() => setActiveTab('tokens')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ⭐ {t('profile.upgradeToPremium', 'Upgrade to Premium')}
                  </button>
                  <p className="text-xs text-slate-500 mt-2">{t('profile.unlockFeatures', 'Unlock exclusive features!')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700 pb-3">
            {['profile', 'tokens', 'dealers', 'achievements', ...(userType === 'admin' ? ['admin'] : [])].map((tabName) => (
              <button
                key={tabName}
                onClick={() => setActiveTab(tabName as any)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-200 text-sm sm:text-base ${ 
                  activeTab === tabName
                    ? 'bg-amber-500 text-slate-900 border-b-2 border-amber-600'
                    : 'text-slate-300 hover:bg-slate-700/80 hover:text-amber-400'
                }`}
              >
                {t(`profile.tabs.${tabName}`, tabName.charAt(0).toUpperCase() + tabName.slice(1))}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-slate-800/70 backdrop-blur-md rounded-xl border border-slate-700 p-6 min-h-[300px]">
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-4">{t('profile.profileInformation.title', 'Profile Information')}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">{t('profile.profileInformation.accountDetails', 'Account Details')}</h4>
                    <div className="space-y-2 text-slate-300">
                      <p><span className="text-slate-400">{t('profile.profileInformation.email', 'Email')}:</span> {user?.email}</p>
                      <p><span className="text-slate-400">{t('profile.profileInformation.memberSince', 'Member since')}:</span> {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : t('profile.unknown', 'Unknown')}</p>
                      <p><span className="text-slate-400">{t('profile.profileInformation.accountType', 'Account Type')}:</span> <span className={`font-bold ${userBadge.color.replace('bg-', 'text-')}`}>{userBadge.text}</span></p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-3">{t('profile.profileInformation.gameStatistics', 'Game Statistics')}</h4>
                    <div className="space-y-2 text-slate-300">
                      <p><span className="text-slate-400">{t('profile.profileInformation.totalWins', 'Total Wins')}:</span> {userProfile?.totalWins || 0}</p>
                      <p><span className="text-slate-400">{t('profile.profileInformation.totalCoinsEarned', 'Total Coins Earned')}:</span> {userProfile?.totalCoinsEarned || 0}</p>
                      <p><span className="text-slate-400">{t('profile.profileInformation.dealersUnlocked', 'Dealers Unlocked')}:</span> {Object.keys(playerData?.dealerProgress || {}).length}</p>
                      <p><span className="text-slate-400">{t('profile.profileInformation.favoriteDealer', 'Favorite Dealer')}:</span> {userProfile?.favoriteDealer || t('profile.none', 'None')}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                    <button 
                        onClick={() => auth.signOut()} 
                        className="w-full md:w-auto px-6 py-3 bg-red-600/80 hover:bg-red-500/80 rounded-lg text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        {t('profile.signOut', 'Sign Out')}
                    </button>
                </div>
              </div>
            )}

            {activeTab === 'tokens' && (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-6">{t('profile.tokenShop.title', 'Token Shop')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tokenDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className={`relative bg-slate-700/50 rounded-xl border p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col justify-between ${ 
                        deal.popular 
                          ? 'border-amber-400 shadow-amber-500/30 ring-2 ring-amber-500/50'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {deal.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          {t('profile.tokenShop.mostPopular', 'MOST POPULAR')}
                        </div>
                      )}
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-white mb-2 mt-2">{deal.name}</h4>
                        <div className="text-4xl font-bold text-green-400 mb-2">
                          {deal.coins.toLocaleString()} <span className="text-2xl">💰</span>
                        </div>
                        {deal.bonus && (
                          <div className="text-amber-300 text-sm mb-3 h-10 flex items-center justify-center">
                            {deal.bonus}
                          </div>
                        )}
                        <div className="mb-4 h-10 flex items-center justify-center">
                          {deal.originalPrice && (
                            <span className="text-slate-400 line-through text-lg mr-2">
                              ${deal.originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-3xl font-bold text-white">
                            ${deal.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePurchaseTokens(deal)}
                        disabled={purchaseStatus[deal.id] === 'processing'}
                        className={`w-full mt-auto py-3 rounded-lg font-bold transition-all duration-200 text-base ${ 
                          purchaseStatus[deal.id] === 'success'
                            ? 'bg-green-500 text-white cursor-not-allowed'
                            : purchaseStatus[deal.id] === 'error'
                            ? 'bg-red-500 text-white'
                            : purchaseStatus[deal.id] === 'processing'
                            ? 'bg-yellow-500 text-slate-900 animate-pulse cursor-wait'
                            : deal.popular
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-900 shadow-lg hover:shadow-xl'
                            : 'bg-slate-600 hover:bg-slate-500 text-white'
                        }`}
                      >
                        {purchaseStatus[deal.id] === 'processing' && t('profile.tokenShop.processing', '⏳ Processing...')}
                        {purchaseStatus[deal.id] === 'success' && t('profile.tokenShop.purchased', '✅ Purchased!')}
                        {purchaseStatus[deal.id] === 'error' && t('profile.tokenShop.failed', '❌ Failed')}
                        {(!purchaseStatus[deal.id] || purchaseStatus[deal.id] === 'idle') && t('profile.tokenShop.purchase', 'Purchase')}
                      </button>
                    </div>
                  ))}
                </div>
                {userType === 'free' && (
                  <div className="mt-8 bg-yellow-900/30 border border-yellow-500/40 rounded-lg p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🔒</span>
                      <div>
                        <h4 className="font-bold text-yellow-300">{t('profile.freeAccountLimitations.title', 'Free Account Limitations')}</h4>
                        <p className="text-yellow-200 text-sm">
                          {t('profile.freeAccountLimitations.description', 'Upgrade to Premium for unlimited daily coins, access to all dealers, and exclusive outfits!')}
                        </p>
                        <button 
                            onClick={() => setActiveTab('tokens')} // Or navigate to a dedicated premium page
                            className="mt-3 text-amber-400 hover:text-amber-300 underline text-sm font-semibold"
                        >
                          {t('profile.freeAccountLimitations.upgradeLink', 'Learn More & Upgrade')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dealers' && (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-6">{t('profile.dealers.title', 'Unlocked Dealers')}</h3>
                {(userProfile?.unlockedDealers && userProfile.unlockedDealers.length > 0) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {userProfile.unlockedDealers.map((dealerId) => (
                      <div key={dealerId} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-amber-500/50 transition-all duration-200 shadow-lg hover:shadow-amber-500/20">
                        <div className="flex flex-col items-center text-center">
                          {/* Placeholder for dealer image or icon */}
                          <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center text-3xl mb-3">
                            {/* Example: Use first letter of dealerId or a generic icon */}
                            {dealerId.substring(0,1).toUpperCase() || 'D'}
                          </div>
                          <h4 className="font-bold text-white text-lg">{dealerId}</h4>
                          {/* Add more dealer info if available */}
                          <button
                            onClick={() => navigate(`/game/${dealerId}`)} // Navigate to game with dealer
                            className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            {t('profile.dealers.playWithDealer', 'Play')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">{t('profile.dealers.noDealersUnlocked', 'No dealers unlocked yet. Play games to unlock more dealers!')}</p>
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-6">{t('profile.achievements.title', 'Achievements')}</h3>
                {(userProfile?.achievements && userProfile.achievements.length > 0) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {userProfile.achievements.map((achievement, index) => (
                      <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 flex items-center gap-3 shadow-md">
                        <span className="text-3xl text-amber-400">🏆</span>
                        <div>
                          <h4 className="font-bold text-white">{achievement}</h4>
                          {/* Add description or date if available */}
                          <p className="text-slate-400 text-sm">{t('profile.achievements.unlockedRecently', 'Unlocked recently')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">{t('profile.achievements.noAchievements', 'No achievements earned yet. Keep playing!')}</p>
                )}

                {userType === 'free' && (
                  <div className="mt-8 bg-yellow-900/30 border border-yellow-500/40 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-4xl">🔒</span>
                      <div>
                        <h4 className="font-bold text-yellow-300 text-lg">{t('profile.achievements.lockedTitle', 'Locked Achievements')}</h4>
                        <p className="text-yellow-200 text-sm mb-3">
                          {t('profile.achievements.lockedDescription', 'Upgrade to Premium to unlock exclusive achievements and showcase your skills!')}
                        </p>
                        <button 
                            onClick={() => setActiveTab('tokens')} // Or navigate to a dedicated premium page
                            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-900 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          {t('profile.achievements.upgradeButton', 'View Premium Options')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'admin' && userType === 'admin' && (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-6">{t('profile.adminPanel.title', 'Admin Panel')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <button
                    onClick={() => navigate('/dealer-management')}
                    className="bg-slate-700/50 hover:bg-slate-600/70 rounded-lg p-6 border border-slate-600 hover:border-amber-500/50 transition-all duration-200 text-left shadow-lg hover:shadow-amber-500/20"
                  >
                    <div className="text-3xl mb-3">👩‍💼</div>
                    <h4 className="font-bold text-white text-lg mb-1">{t('profile.adminPanel.dealerManagement.title', 'Dealer Management')}</h4>
                    <p className="text-slate-400 text-sm">{t('profile.adminPanel.dealerManagement.description', 'Add, edit, and manage dealers')}</p>
                  </button>
                  <button
                    onClick={() => navigate('/admin-page')}
                    className="bg-slate-700/50 hover:bg-slate-600/70 rounded-lg p-6 border border-slate-600 hover:border-amber-500/50 transition-all duration-200 text-left shadow-lg hover:shadow-amber-500/20"
                  >
                    <div className="text-3xl mb-3">⚙️</div>
                    <h4 className="font-bold text-white text-lg mb-1">{t('profile.adminPanel.adminDashboard.title', 'Admin Dashboard')}</h4>
                    <p className="text-slate-400 text-sm">{t('profile.adminPanel.adminDashboard.description', 'System administration tools')}</p>
                  </button>
                  <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 shadow-lg">
                    <div className="text-3xl mb-3">📊</div>
                    <h4 className="font-bold text-white text-lg mb-1">{t('profile.adminPanel.analytics.title', 'Analytics')}</h4>
                    <p className="text-slate-400 text-sm">{t('profile.adminPanel.analytics.description', 'View platform statistics')}</p>
                    <p className="text-green-400 text-xs mt-2 font-semibold">{t('profile.comingSoon', 'Coming Soon')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
