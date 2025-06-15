import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../app/auth/useCurrentUser';
import { firebaseAuth } from '../app/auth/firebase';
import { signOut } from 'firebase/auth';
import { isAdminUser } from '../utils/adminDealerManager';
import AnimatedCoinCounter from './AnimatedCoinCounter';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Store, User as UserIcon, LogOut, Settings, UserCog } from 'lucide-react';
import { CoinBalanceWallet } from './CoinBalanceWallet';
import { LanguageSelector } from './LanguageSelector/LanguageSelector';

interface AppHeaderProps {
  title?: string;
  subtitle?: string | null;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  backTo?: string;
  className?: string;
  playerBalance: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = "Black Jack Chat",
  subtitle = null,
  showHomeButton = true,
  showBackButton = false,
  backTo = "/",
  className = "",
  playerBalance = 0
}) => {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (currentUser) {
        const adminStatus = await isAdminUser(currentUser.uid);
        setIsAdmin(adminStatus);
      }
    };
    checkAdmin();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const userInitial = currentUser?.displayName?.[0] || currentUser?.email?.[0]?.toUpperCase() || 'U';
  const { t } = useTranslation();

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 shadow-lg safe-top ${className}`}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 h-14 sm:h-16 flex items-center justify-between">
        {/* Left side navigation with logo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <img 
            src="/logo-blackjack-royal.png" 
            alt="Blackjack Logo" 
            className="h-6 sm:h-8 w-auto opacity-90 hover:opacity-100 transition-opacity flex-shrink-0" 
          />
          <span className="hidden md:block text-amber-400 font-bold text-xs sm:text-sm truncate">Blackjack Royal</span>
          
          {showBackButton && (
            <button
              onClick={() => navigate(backTo || '/')}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border transition-all duration-300 bg-slate-800/40 hover:bg-slate-700/60 border-amber-400/10 hover:border-amber-400/30 text-slate-300/80 hover:text-amber-400 touch-target touch-manipulation flex-shrink-0"
            >
              <span className="text-base sm:text-lg">←</span>
              <span className="hidden sm:inline text-xs sm:text-sm font-medium">{t('general.back')}</span>
            </button>
          )}
        </div>

        {/* Center title - responsive positioning */}
        <div className="text-center flex-1 min-w-0 mx-2">
          <h1 className="text-amber-400/90 font-bold text-sm sm:text-lg lg:text-xl truncate">
            {title || t('general.appName')}
          </h1>
          {subtitle && (
            <p className={`text-xs lg:text-sm truncate ${subtitle.includes('Turn') ? 'text-green-400/90 animate-pulse' : 'text-amber-300/80'}`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side controls - optimized for mobile */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end min-w-0">
          {/* Language selector - hidden on very small screens */}
          <div className="hidden xs:block">
            <LanguageSelector />
          </div>
          
          {/* Coin balance - compact on mobile */}
          <div className="hidden sm:block">
            <CoinBalanceWallet balance={playerBalance} />
          </div>
          
          {/* Mobile coin balance - compact version */}
          <div className="sm:hidden bg-slate-800/40 rounded-lg px-2 py-1 border border-amber-400/20">
            <span className="text-amber-300 font-semibold text-xs">
              {playerBalance > 999 ? `${Math.floor(playerBalance / 1000)}k` : playerBalance}💰
            </span>
          </div>
          
          {/* User dropdown */}
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full border bg-slate-800/40 hover:bg-slate-700/60 border-purple-400/10 hover:border-purple-400/30 text-purple-400/70 hover:text-purple-300 transition-all touch-target touch-manipulation flex-shrink-0">
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-48 sm:w-56 mr-2 sm:mr-4 bg-slate-800/95 backdrop-blur-md border-slate-700 text-slate-200"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="text-xs sm:text-sm">{t('header.myAccount', 'My Account')}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                
                {/* Mobile-only language selector */}
                <div className="xs:hidden px-2 py-2 border-b border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Language</div>
                  <LanguageSelector />
                </div>
                
                {/* Mobile-only full coin balance */}
                <div className="sm:hidden px-2 py-2 border-b border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Balance</div>
                  <div className="text-amber-300 font-semibold text-sm">{playerBalance} coins 💰</div>
                </div>
                
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer focus:bg-slate-700 touch-target">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span className="text-xs sm:text-sm">{t('header.profile', 'Profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/shop')} className="cursor-pointer focus:bg-slate-700 touch-target">
                  <Store className="mr-2 h-4 w-4" />
                  <span className="text-xs sm:text-sm">{t('header.tokenShop', 'Token Shop')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer focus:bg-slate-700 touch-target">
                  <Settings className="mr-2 h-4 w-4" />
                  <span className="text-xs sm:text-sm">{t('header.settings', 'Settings')}</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin-page')} className="cursor-pointer focus:bg-slate-700 touch-target">
                    <UserCog className="mr-2 h-4 w-4" />
                    <span className="text-xs sm:text-sm">{t('header.admin', 'Admin Panel')}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer focus:bg-red-900/50 text-red-400 focus:text-red-300 touch-target">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="text-xs sm:text-sm">{t('header.logout', 'Log Out')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-xs sm:text-sm font-semibold"
            >
              {t('header.login', 'Login')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}; 