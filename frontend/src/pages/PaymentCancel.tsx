import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { usePlayerProgressStore } from '../utils/usePlayerProgressStore';

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();
  const { playerData } = usePlayerProgressStore();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 text-white flex flex-col relative overflow-x-hidden">
      
      {/* Luxe Casino Background Effects - Identiek aan homepage */}
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

      <AppHeader 
        title="Betaling Geannuleerd" 
        showBackButton={true} 
        backTo="/"
        playerBalance={playerData?.playerCoins ?? 0} 
      />
      
      <div className="relative z-20 flex-grow flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl">
          
          {/* Premium Cancel Card */}
          <div className="relative bg-gradient-to-br from-slate-900/90 via-red-900/95 to-slate-900/90 backdrop-blur-xl rounded-3xl border border-red-400/40 shadow-2xl overflow-hidden">
            
            {/* Luxe overlay patterns */}
            <div className="absolute inset-0">
              {/* Subtle casino pattern overlay */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'url(/casino-pattern.png)',
                  backgroundSize: '200px 200px',
                  backgroundRepeat: 'repeat',
                  backgroundBlendMode: 'soft-light'
                }}
              ></div>
              
              {/* Premium glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10"></div>
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent"></div>
            </div>
            
            <div className="relative z-10 p-12 text-center">
              
              {/* Premium Cancel Icon with Glow */}
              <div className="relative mx-auto mb-8">
                {/* Glow effect */}
                <div className="absolute inset-0 w-24 h-24 bg-red-400/30 rounded-full blur-xl"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50">
                  <span className="text-5xl">⏸️</span>
                </div>
              </div>

              {/* Premium Cancel Message */}
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-300 via-orange-200 to-red-300 bg-clip-text text-transparent mb-6">
                Betaling Geannuleerd
              </h1>
              
              <p className="text-red-100/90 text-xl mb-8 leading-relaxed">
                Geen probleem! Je betaling is geannuleerd en er zijn geen kosten in rekening gebracht.
              </p>

              {/* Luxe Info Box */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/50 to-blue-900/40 backdrop-blur-sm rounded-2xl border border-blue-400/30 p-8">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="relative">
                      {/* Tip glow effect */}
                      <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg"></div>
                      <span className="relative text-4xl">💡</span>
                    </div>
                    <h3 className="text-blue-300 font-bold text-2xl">Casino Tip</h3>
                  </div>
                  <p className="text-blue-100/90 text-lg leading-relaxed">
                    Premium coins geven je toegang tot exclusieve dealer outfits, geavanceerde chat features en VIP casino ervaringen. 
                    <br /><span className="text-blue-200 font-semibold">Kom terug wanneer je klaar bent voor de ultieme casino ervaring!</span>
                  </p>
                </div>
              </div>

              {/* Premium Balance Display */}
              <div className="mb-10">
                <div className="bg-gradient-to-r from-amber-900/40 via-yellow-900/50 to-amber-900/40 backdrop-blur-sm rounded-2xl border border-amber-400/30 p-8">
                  <h3 className="text-amber-300 font-bold text-2xl mb-4">Je Huidige Saldo</h3>
                  <div className="flex items-center justify-center gap-4">
                    <div className="relative">
                      {/* Coin glow effect */}
                      <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-lg"></div>
                      <span className="relative text-6xl">💰</span>
                    </div>
                    <span className="text-5xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                      {playerData?.playerCoins?.toLocaleString() || 0}
                    </span>
                  </div>
                  <p className="text-amber-200/80 text-sm mt-3">Premium Casino Coins</p>
                </div>
              </div>

              {/* Premium Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 hover:from-slate-500 hover:via-slate-600 hover:to-slate-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-slate-500/30 hover:shadow-slate-400/40 transform hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-xl">🏠</span>
                    Terug naar Casino
                  </span>
                </button>
                
                <button
                  onClick={() => navigate('/shop')}
                  className="flex-1 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 hover:from-amber-500 hover:via-yellow-500 hover:to-amber-500 text-black font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-amber-500/30 hover:shadow-amber-400/40 transform hover:scale-105"
                >
                  <span className="flex items-center justify-center gap-3">
                    <span className="text-xl">🎲</span>
                    Probeer Opnieuw
                  </span>
                </button>
              </div>

              {/* Elegant Auto redirect notice */}
              <div className="bg-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-400/20 p-4">
                <p className="text-slate-300 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                    Automatische doorverwijzing in <span className="text-red-400 font-bold text-lg mx-1">{countdown}</span> seconden
                  </span>
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentCancel; 