import React from 'react';
import { motion } from 'framer-motion';
import { Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DealerData } from '../utils/adminDealerManager';
import { Button } from './ui/button';
import { PlayerDealerProgress } from 'utils/usePlayerProgressStore';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../app/auth/useCurrentUser';

interface DealerCardProps {
  dealer: DealerData;
  progress?: PlayerDealerProgress;
  onSelectDealer: (dealerId: string) => void;
  index: number;
}

export const DealerCard = ({ dealer, progress, onSelectDealer, index }: DealerCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();

  const handleCardClick = () => {
    // Als gebruiker niet ingelogd is, doorsturen naar login
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // Anders normale flow
    onSelectDealer(dealer.id);
  };
  
  const primaryImageUrl = dealer.avatarUrl || '/placeholder.png';

  const { winsWithDealer = 0, gamesPlayedWithDealer = 0 } = progress || {};
  const winRate = gamesPlayedWithDealer > 0 ? Math.round((winsWithDealer / gamesPlayedWithDealer) * 100) : 'N/A';
  const displayRate = winRate === 'N/A' ? 'N/A' : `${winRate}%`;
  
  // Generate random years of experience between 2-8 years
  const yearsExperience = dealer.experience || Math.floor(Math.random() * 6) + 2;

  return (
    <motion.div
      className="relative w-full h-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-xl transition-all duration-300 group cursor-pointer border-4 border-slate-800/80 hover:border-amber-400/50 focus-within:border-amber-400/50"
      onClick={handleCardClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      style={{ aspectRatio: '4 / 6' }} // Make it taller and wider
    >
      {/* Background Image */}
      <img
        src={primaryImageUrl}
        alt={dealer.name}
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
      />
      
      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {/* Glossy effect */}
        <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="p-4 text-white space-y-3">
            <h3 className="text-xl font-semibold tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)', fontFamily: "'Montserrat', sans-serif" }}>{dealer.name}</h3>
            
            <div className="flex justify-start items-center text-sm font-semibold opacity-90 backdrop-blur-sm bg-black/20 p-2 rounded-md">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span>{dealer.title || t('home.professionalText')}</span>
              </div>
            </div>
            
            <div className="flex justify-start items-center text-sm font-medium text-green-400 opacity-90">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{yearsExperience} {t('home.experienceText')}</span>
            </div>

            <Button 
              variant="default" 
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-base py-3 rounded-lg shadow-lg hover:shadow-amber-500/30 transform transition-transform hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              {t('general.play')}
            </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DealerCard;
