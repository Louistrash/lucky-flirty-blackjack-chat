import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "./ui/carousel.tsx";
import DealerCard from "./DealerCard";
import type { DealerData } from '../utils/adminDealerManager';
import type { PlayerData } from "../utils/usePlayerProgressStore";

export interface Props {
  dealers: DealerData[];
  playerData: PlayerData | null;
  onSelectDealer: (dealerId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const DealerCarousel: React.FC<Props> = ({ dealers, onSelectDealer, isLoading, error, playerData }) => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [count, setCount] = useState(0);

  // Update current slide when carousel API changes
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrentSlide(api.selectedScrollSnap());

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-400 mb-6"></div>
        <p className="text-2xl text-amber-400 font-semibold animate-pulse">
          {t('carousel.loading.dealers', 'Loading dealers...')}
        </p>
        <p className="text-slate-400 mt-2">{t('carousel.loading.wait', 'Please wait, preparing your casino experience')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center py-20 bg-red-900/20 rounded-xl border border-red-800">
        <div className="text-6xl mb-4">🎰</div>
        <p className="text-2xl text-red-400 font-semibold mb-2">{t('carousel.error.title', 'Oops! Something went wrong')}</p>
        <p className="text-red-300 text-center max-w-md">
          {error}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 touch-manipulation"
        >
          {t('carousel.error.retry', 'Try Again')}
        </button>
      </div>
    );
  }

  if (!dealers || dealers.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-20 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="text-6xl mb-4 opacity-50">🃏</div>
        <p className="text-2xl text-slate-400 font-semibold mb-2">{t('carousel.noDealers.title', 'No dealers available')}</p>
        <p className="text-slate-500 text-center max-w-md">
          {t('carousel.noDealers.message', 'There are currently no active dealers. Check back later for exciting blackjack sessions!')}
        </p>
      </div>
    );
  }

  const handleDotClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  return (
    <div className="dealer-carousel w-full max-w-7xl mx-auto py-8 sm:py-16 px-4 sm:px-12 lg:px-16" style={{ overflow: 'visible' }}>
      {/* Section Header */}
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white lg:text-4xl">
          {t('carousel.title', 'Choose your Dealer')}
        </h2>
        <p className="mt-2 sm:mt-4 text-base sm:text-lg text-gray-400">
          {t('carousel.subtitle', 'Each dealer has a unique style and skill.')}
        </p>
      </div>

      {/* Enhanced Mobile Touch Instructions */}
      <div className="flex justify-center mb-6 sm:hidden">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-full px-4 py-2 border border-amber-400/30 shadow-lg">
          <div className="flex items-center space-x-2 text-amber-400 font-medium text-sm">
            <span className="animate-pulse">👆</span>
            <span>{t('carousel.mobile.explore', 'Tap or swipe to explore dealers')}</span>
            <span className="animate-pulse">👆</span>
          </div>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: true,
            swipeThreshold: 30, // Lower threshold for easier swiping
            velocityThreshold: 0.2, // Lower velocity for momentum
          }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent 
            className="-ml-2 sm:-ml-4 cursor-grab active:cursor-grabbing"
            style={{
              touchAction: 'pan-x',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {dealers.map((dealer, index) => {
              const progress = playerData?.dealerProgress?.[dealer.id];
              return (
                <CarouselItem key={dealer.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 pl-2 sm:pl-4">
                  <DealerCard 
                    dealer={dealer} 
                    onSelectDealer={onSelectDealer}
                    index={index}
                    progress={progress}
                  />
                </CarouselItem>
              )
            })}
          </CarouselContent>
          
          {/* Enhanced Navigation Arrows - Only show on larger screens */}
          {dealers.length > 1 && (
            <>
              <CarouselPrevious 
                className="hidden sm:flex absolute left-[-2.5rem] top-1/2 -translate-y-1/2 z-30" 
              />
              <CarouselNext 
                className="hidden sm:flex absolute right-[-2.5rem] top-1/2 -translate-y-1/2 z-30" 
              />
            </>
          )}
        </Carousel>
      </div>

      {/* Enhanced Pagination Dots - Smaller for mobile */}
      <div className="flex justify-center mt-6 sm:mt-8 mb-4">
        <div className="pagination-dots-container flex space-x-2 sm:space-x-3 bg-black/40 backdrop-blur-sm rounded-full px-3 sm:px-6 py-2 sm:py-3 border border-amber-400/20">
          {dealers.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot rounded-full transition-all duration-300 touch-manipulation ${
                index === currentSlide 
                  ? 'bg-amber-400 shadow-lg shadow-amber-400/50 ring-1 ring-amber-400/30 active' 
                  : 'bg-amber-400/40 hover:bg-amber-400/70'
              }`}
              onClick={() => handleDotClick(index)}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              style={{
                width: '8px',
                height: '8px',
                minWidth: '8px',
                minHeight: '8px',
                touchAction: 'manipulation'
              }}
              aria-label={t('carousel.mobile.goTo', 'Go to dealer {{index}}', { index: index + 1 })}
            />
          ))}
        </div>
      </div>

      {/* Enhanced Touch Instructions for Mobile */}
      <div className="text-center mt-4 sm:hidden">
        <div className="inline-flex items-center space-x-2 bg-slate-800/30 backdrop-blur-sm rounded-full px-3 py-1 border border-amber-400/20">
          <span className="text-amber-400 text-xs font-medium">
            {t('carousel.mobile.dealerCount', '{{current}} of {{total}} dealers', { current: currentSlide + 1, total: count })}
          </span>
        </div>
      </div>

      {/* Descriptive Text - More elegant styling */}
      <div className="text-center mt-8 sm:mt-12 mb-4 sm:mb-6">
        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
          {t('carousel.description.line1', 'Experience the thrill of authentic blackjack with our professional live dealers.')}
          <span className="text-amber-400 font-medium"> {t('carousel.description.line2', 'Each dealer offers a unique playstyle.')}</span>
        </p>
      </div>
    </div>
  );
};

export default DealerCarousel;
