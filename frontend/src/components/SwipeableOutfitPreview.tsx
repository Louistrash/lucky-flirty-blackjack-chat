import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { usePlayerProgressStore } from '../utils/usePlayerProgressStore';
import { type DealerData, type OutfitStageData } from '../utils/adminDealerManager';

// Touch/Swipe interface definitions for outfit preview
interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

interface SwipeState {
  isDragging: boolean;
  startPos: TouchPosition | null;
  currentPos: TouchPosition | null;
  direction: 'left' | 'right' | null;
}

// Utility functions for touch handling
const getTouchPosition = (event: TouchEvent | MouseEvent): TouchPosition => {
  const touch = 'touches' in event ? event.touches[0] : event;
  return {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now()
  };
};

const getSwipeDirection = (start: TouchPosition, end: TouchPosition): 'left' | 'right' | null => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  
  // Only consider horizontal swipes if horizontal movement is greater than vertical
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
    return deltaX > 0 ? 'right' : 'left';
  }
  return null;
};

// Iconen
const CheckIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const LockIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 2.5a2.5 2.5 0 012.5 2.5V7h-5V7a2.5 2.5 0 012.5-2.5z" />
  </svg>
);

const NoAccessIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g className="text-slate-400/80">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    </g>
    <g className="text-red-500/90">
      <path d="M7 7L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

interface SwipeableOutfitPreviewProps {
  dealer: DealerData & { experience?: string; winRate?: string; title?: string; }; // Voeg 'title' toe voor bijv. "Baccarat Beauty"
  currentOutfitStage: number;
  onOutfitChange: (newStage: number) => void;
  onTeaserClick: () => void;
  showOutfitPreview: boolean;
  showTeaserOverlay?: boolean;
  unlockedOutfits?: number[];
}

const SwipeableOutfitPreview: React.FC<SwipeableOutfitPreviewProps> = ({
  dealer,
  currentOutfitStage,
  onOutfitChange,
  onTeaserClick,
  showOutfitPreview,
  showTeaserOverlay,
  unlockedOutfits = [0]
}) => {
  const { playerData } = usePlayerProgressStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch/Swipe state
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    startPos: null,
    currentPos: null,
    direction: null
  });

  // Get current outfit data
  const currentOutfit = dealer.outfitStages?.[currentOutfitStage];
  
  // Calculate max unlocked stage based on dealer progress
  const dealerProgress = playerData?.dealerProgress?.[dealer.id];
  const maxUnlockedStageBasedOnProgress = dealerProgress ? dealerProgress.currentOutfitStageIndex : 0;

  const isStageUnlocked = (stageIndex: number): boolean => {
    if (unlockedOutfits && unlockedOutfits.length > 0) return unlockedOutfits.includes(stageIndex);
    return stageIndex <= maxUnlockedStageBasedOnProgress; // Fallback op progress als unlockedOutfits niet gezet is
  };

  const getStageImageUrl = (stageIndex: number): string => {
    const stage = dealer.outfitStages?.[stageIndex];
    const imageUrl = stage?.imageUrl || dealer.avatarUrl || '';
    
    console.log('🖼️ DEBUG getStageImageUrl:', {
      stageIndex,
      dealerName: dealer.name,
      outfitStagesLength: dealer.outfitStages?.length,
      currentOutfitStageData: stage,
      stageImageUrl: stage?.imageUrl,
      dealerAvatarUrl: dealer.avatarUrl,
      finalImageUrl: imageUrl
    });
    
    return imageUrl;
  };

  const totalStages = dealer.outfitStages?.length || 1;

  const handlePrevOutfit = useCallback(() => {
    if (totalStages <= 1) return; // Voorkom actie als er maar één stage is
    const prevStage = (currentOutfitStage - 1 + totalStages) % totalStages;
    onOutfitChange(prevStage);

    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [currentOutfitStage, totalStages, onOutfitChange]);

  const handleNextOutfit = useCallback(() => {
    if (totalStages <= 1) return; // Voorkom actie als er maar één stage is
    const nextStage = (currentOutfitStage + 1) % totalStages;
    onOutfitChange(nextStage);

    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [currentOutfitStage, totalStages, onOutfitChange]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: TouchEvent | MouseEvent) => {
    e.stopPropagation();
    const position = getTouchPosition(e);
    setSwipeState({
      isDragging: true,
      startPos: position,
      currentPos: position,
      direction: null
    });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!swipeState.isDragging || !swipeState.startPos) return;

    const position = getTouchPosition(e);
    const direction = getSwipeDirection(swipeState.startPos, position);
    
    setSwipeState(prev => ({
      ...prev,
      currentPos: position,
      direction
    }));

    // Prevent default scrolling if we're handling a horizontal swipe
    if (direction) {
      e.preventDefault();
    }
  }, [swipeState.isDragging, swipeState.startPos]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isDragging || !swipeState.startPos || !swipeState.currentPos) {
      setSwipeState({ isDragging: false, startPos: null, currentPos: null, direction: null });
      return;
    }

    const { direction } = swipeState;
    
    if (direction && totalStages > 1) {
      if (direction === 'left') {
        handleNextOutfit();
      } else if (direction === 'right') {
        handlePrevOutfit();
      }
    }

    setSwipeState({
      isDragging: false,
      startPos: null,
      currentPos: null,
      direction: null
    });
  }, [swipeState, totalStages, handleNextOutfit, handlePrevOutfit]);

  // Setup touch event listeners
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    // Mouse events for desktop
    element.addEventListener('mousedown', handleTouchStart);
    element.addEventListener('mousemove', handleTouchMove);
    element.addEventListener('mouseup', handleTouchEnd);
    element.addEventListener('mouseleave', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('mousedown', handleTouchStart);
      element.removeEventListener('mousemove', handleTouchMove);
      element.removeEventListener('mouseup', handleTouchEnd);
      element.removeEventListener('mouseleave', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const actuallyUnlockedCount = dealer.outfitStages?.filter((_,idx) => isStageUnlocked(idx)).length || 1;

  // Pijlen alleen disablen als er maar 1 outfit is
  const canGoToPrev = useMemo(() => {
    return totalStages > 1;
  }, [totalStages]);

  const canGoToNext = useMemo(() => {
    return totalStages > 1;
  }, [totalStages]);

  return (
    <div className="flex flex-col h-full space-y-3 sm:space-y-4">
      {/* Afbeelding Container met Gallery-stijl omlijsting */}
      <div 
        ref={containerRef}
        className={`relative flex-grow rounded-xl overflow-hidden shadow-2xl ${!isStageUnlocked(currentOutfitStage) ? 'cursor-pointer' : ''} ${swipeState.isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'} touch-pan-y`}
        onClick={() => {
          if (!isStageUnlocked(currentOutfitStage)) {
            onOutfitChange(currentOutfitStage); // Trigger unlock prompt via GamePage
          }
        }}
      >
        {/* Foto met directe border eromheen */}
        <div className="relative w-full h-full bg-gradient-to-br from-slate-600/40 to-slate-800/60 rounded-lg shadow-inner">
          {getStageImageUrl(currentOutfitStage) ? (
            <div className="relative w-full h-full p-2">
              <img
                src={getStageImageUrl(currentOutfitStage)}
                alt={`${dealer.name} - ${currentOutfit?.stageName || 'Outfit'}`}
                className={`w-full h-full object-contain object-center transition-all duration-300 ${!isStageUnlocked(currentOutfitStage) ? 'filter blur-md scale-105' : ''} select-none`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (dealer.avatarUrl && target.src !== dealer.avatarUrl) {
                    target.src = dealer.avatarUrl;
                  } else {
                    target.src = '/placeholder-dealer.png';
                    target.style.objectFit = 'contain';
                    target.style.padding = '10%';
                  }
                  console.error("Image failed to load, fallback used:", target.src);
                }}
                draggable={false}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-1/2 h-1/2 text-slate-500/70" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
            </div>
          )}

          {/* Overlay voor vergrendelde afbeelding */}
          {!isStageUnlocked(currentOutfitStage) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm group">
              <div className="relative">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-amber-400/80 cursor-pointer transition-transform hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 2.5a2.5 2.5 0 012.5 2.5V7h-5V7a2.5 2.5 0 012.5-2.5z" />
                </svg>
                {/* Tooltip/Badge dat alleen verschijnt bij hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-30">
                  <div className="bg-black/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-amber-400/30 shadow-xl">
                    <p className="text-amber-300 text-sm font-semibold whitespace-nowrap">Outfit Vergrendeld</p>
                    <p className="text-slate-300 text-xs mt-1 whitespace-nowrap">Tik om te ontgrendelen</p>
                    {/* Kleine pijl onder de tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigatie Pijlen (over afbeelding) - Enhanced for touch */}
          {totalStages > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevOutfit();
                }}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 w-10 h-10 sm:w-12 sm:h-12 bg-black/60 hover:bg-black/80 hover:scale-110 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400/70 disabled:opacity-30 z-20 backdrop-blur-sm border border-white/20 touch-manipulation"
                aria-label="Previous outfit"
                disabled={!canGoToPrev}
              >
                <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextOutfit();
                }}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 w-10 h-10 sm:w-12 sm:h-12 bg-black/60 hover:bg-black/80 hover:scale-110 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400/70 disabled:opacity-30 z-20 backdrop-blur-sm border border-white/20 touch-manipulation"
                aria-label="Next outfit"
                disabled={!canGoToNext}
              >
                <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          {/* Swipe Instruction for Mobile */}
          {totalStages > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 sm:hidden">
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 border border-amber-400/30">
                <span className="text-amber-400 text-xs font-medium flex items-center">
                  <span className="mr-1">👈</span>
                  Swipe
                  <span className="ml-1">👉</span>
                </span>
              </div>
            </div>
          )}

          {/* Dealer Naam (linksonder afbeelding, boven de badges) */}
          <div className="absolute left-3 sm:left-4 lg:left-5 bottom-16 sm:bottom-18 pointer-events-none z-15">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-amber-300 drop-shadow-lg backdrop-blur-sm bg-black/20 px-2 py-1 rounded-md">{dealer.name}</h2>
          </div>

          {/* Badges Overlay (verlaagd, onder de naam maar boven outfit naam) */}
          <div className="absolute inset-x-0 bottom-6 sm:bottom-8 px-3 sm:px-4 lg:px-5 flex justify-between items-center pointer-events-none z-15">
            {dealer.experience && (
              <span className="text-[8px] sm:text-[9px] lg:text-[10px] bg-amber-600/70 text-white px-1 py-0.5 sm:px-1.5 sm:py-0.5 lg:px-2 lg:py-0.5 rounded-md font-medium shadow-lg pointer-events-auto backdrop-blur-md border border-amber-500/50">
                {dealer.experience}
              </span>
            )}
            {dealer.winRate && (
              <span className="text-[8px] sm:text-[9px] lg:text-[10px] bg-green-600/70 text-white px-1 py-0.5 sm:px-1.5 sm:py-0.5 lg:px-2 lg:py-0.5 rounded-md font-medium shadow-lg pointer-events-auto backdrop-blur-md border border-green-500/50">
                Win Rate: {dealer.winRate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progressie Sectie (onder afbeelding) */}
      <div className="bg-slate-700/40 rounded-lg p-2 sm:p-2.5 lg:p-3 border border-slate-600/50" style={{ marginTop: '10px' }}>
        {/* Stage Iconen (Vinkjes/Slotjes) */}
        <div className="flex justify-around items-center mb-2 sm:mb-2.5">
          {dealer.outfitStages?.map((stage, index) => (
            <div 
              key={index}
              className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 ${
                index === currentOutfitStage ? 'scale-110' : 'hover:scale-105'
              } touch-manipulation group`}
              onClick={(e) => {
                e.stopPropagation();
                onOutfitChange(index);
              }}
            >
              <div className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                isStageUnlocked(index) 
                  ? 'bg-amber-400/20 border-amber-400/60 text-amber-400' 
                  : 'bg-slate-600/30 border-slate-500/50 text-slate-500'
              } ${index === currentOutfitStage ? 'ring-2 ring-amber-400/50 shadow-lg' : ''}`}>
                {isStageUnlocked(index) ? <CheckIcon /> : <LockIcon />}
              </div>
              
              {/* Tooltip voor vergrendelde stages */}
              {!isStageUnlocked(index) && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-40">
                  <div className="bg-black/90 backdrop-blur-sm rounded-lg px-2 py-1 border border-red-400/30 shadow-xl">
                    <p className="text-red-300 text-xs font-semibold whitespace-nowrap">Vergrendeld</p>
                    <p className="text-slate-300 text-[10px] whitespace-nowrap">Klik om te ontgrendelen</p>
                    {/* Kleine pijl onder de tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                  </div>
                </div>
              )}
              

            </div>
          ))}
        </div>

        {/* Outfit Stage Naam */}
        <div className="text-center">
          <h3 className="text-xs sm:text-sm font-semibold text-amber-300 mb-1">
            {currentOutfit?.stageName || 'Professional'}
          </h3>
          <div className="flex justify-center items-center space-x-2 text-xs text-slate-400">
            <span>{actuallyUnlockedCount}/{totalStages} ontgrendeld</span>
            {totalStages > 1 && (
              <span className="text-amber-400">
                • {currentOutfitStage + 1}/{totalStages}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeableOutfitPreview; 