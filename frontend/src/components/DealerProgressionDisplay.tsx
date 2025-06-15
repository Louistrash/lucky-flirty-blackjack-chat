import React, { useEffect } from 'react';
import { usePlayerProgressStore, PlayerData } from '../utils/usePlayerProgressStore';
import { getDealerById, DealerProfile, OutfitStage } from '../utils/dealerData';
import { Button } from '@/components/ui/button'; // Assuming shadcn button
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { createImageErrorHandler } from "../utils/placeholderImages";

interface Props {
  userId: string | null;
  dealerId: string; // Assuming we always have a selected dealer for this component to show
}

const DealerProgressionDisplay: React.FC<Props> = ({ userId, dealerId }) => {
  const {
    playerData,
    isLoading,
    error,
    subscribeToPlayerProgress,
    unlockOutfitWithCoins,
  } = usePlayerProgressStore();

  useEffect(() => {
    if (userId) {
      const unsubscribe = subscribeToPlayerProgress(userId);
      return () => unsubscribe(); // Cleanup subscription on unmount
    }
  }, [userId, subscribeToPlayerProgress]);

  const dealerProfile = getDealerById(dealerId);

  if (!userId) {
    return <div className="text-center p-4 text-yellow-300">Please log in to see progression.</div>;
  }

  if (isLoading) {
    return <div className="text-center p-4">Loading progression...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error loading progression: {error.message}</div>;
  }

  if (!playerData || !dealerProfile) {
    return <div className="text-center p-4">Could not load player or dealer data.</div>;
  }

  const playerDealerProgress = playerData.dealerProgress[dealerId];
  if (!playerDealerProgress) {
    // This case should ideally be handled by initialization in the store
    // or when a dealer is first interacted with.
    return <div className="text-center p-4">No progression data for this dealer yet. Play a game to start!</div>;
  }

  const currentStageIndex = playerDealerProgress.currentOutfitStageIndex;
  const currentOutfit = dealerProfile.outfitStages[currentStageIndex];

  const nextStageIndex = currentStageIndex + 1;
  const nextOutfit: OutfitStage | undefined = dealerProfile.outfitStages[nextStageIndex];

  const handleUnlockNextWithCoins = () => {
    if (nextOutfit && userId) {
      unlockOutfitWithCoins(userId, dealerId, nextStageIndex);
    }
  };

  const winsForNext = nextOutfit ? nextOutfit.winsToUnlock : 0;
  const progressPercentage = (winsForNext > 0 && playerDealerProgress.winsWithDealer <= winsForNext) 
                             ? (playerDealerProgress.winsWithDealer / winsForNext) * 100 
                             : (nextOutfit ? 0 : 100); // 100 if no next outfit or already past wins needed for it

  return (
    <Card className="bg-slate-800/90 border-amber-400/30 backdrop-blur-sm shadow-xl mt-3 scale-90 origin-top">
      <CardHeader className="py-2">
        <CardTitle className="text-amber-400 text-base">Dealer: {dealerProfile.name}</CardTitle>
        <p className="text-center text-sm text-gray-400">Outfit Progression</p>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-yellow-200">Current Outfit: {currentOutfit.name}</h3>
          <img 
            src={currentOutfit.imageUrl} 
            alt={currentOutfit.name} 
            className="w-48 h-64 object-cover rounded-md mx-auto my-2 border-2 border-gold-400 shadow-lg"
            onError={createImageErrorHandler('OUTFIT')} // Fallback
          />
        </div>

        {nextOutfit && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-yellow-100 mb-1">Next: {nextOutfit.name}</h4>
            <div className="flex items-center justify-between text-sm mb-1">
                <span>Wins: {playerDealerProgress.winsWithDealer} / {winsForNext}</span>
                <span className="text-xs">({Math.floor(progressPercentage)}%)</span>
            </div>
            <Progress value={progressPercentage} className="w-full h-3 bg-gray-700 border border-gold-600 [&>div]:bg-yellow-400" />
            
            <p className="text-sm mt-3 text-center">
              Unlock with <span className="font-bold text-yellow-400">{nextOutfit.coinsToUnlock} coins</span>
            </p>
            <Button 
              onClick={handleUnlockNextWithCoins}
              disabled={playerData.playerCoins < nextOutfit.coinsToUnlock || playerDealerProgress.currentOutfitStageIndex >= nextStageIndex}
              className="w-full mt-2 bg-gold-600 hover:bg-gold-500 text-gray-900 font-bold border border-yellow-700"
            >
              {playerDealerProgress.currentOutfitStageIndex >= nextStageIndex ? "Unlocked" : "Unlock Now"}
            </Button>
            {playerData.playerCoins < nextOutfit.coinsToUnlock && playerDealerProgress.currentOutfitStageIndex < nextStageIndex && (
                <p className='text-xs text-red-400 text-center mt-1'>Not enough coins</p>
            )}
          </div>
        )}

        {!nextOutfit && (
          <p className="text-center mt-4 text-green-400 font-semibold">All outfits unlocked for this dealer!</p>
        )}
        
        <div className="text-center mt-4 text-sm">
            Your Coins: <span className="font-bold text-yellow-500">{playerData.playerCoins}</span>
        </div>

      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-xs text-gray-500">Keep playing to unlock more!</p>
      </CardFooter>
    </Card>
  );
};

export default DealerProgressionDisplay;
