import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { usePlayerProgressStore } from '../utils/usePlayerProgressStore';

const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { playerData } = usePlayerProgressStore();
  const playerBalance = playerData?.playerCoins ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900">
      <AppHeader 
        title="Token Shop" 
        showBackButton={true} 
        backTo="/"
        playerBalance={playerBalance} 
      />
      
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-400 mb-4">🛒 Token Shop</h1>
          <p className="text-slate-300">Koop tokens om je casino ervaring te verbeteren!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Starter Pack */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-amber-400/20 p-6 hover:border-amber-400/40 transition-all duration-200">
            <div className="text-center">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-amber-400 mb-2">Starter Pack</h3>
              <div className="text-3xl font-bold text-green-400 mb-2">500 💰</div>
              <div className="text-2xl font-bold text-white mb-4">€5.00</div>
              <p className="text-slate-400 text-sm mb-6">Perfect om te beginnen</p>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-3 rounded-lg transition-all duration-200"
              >
                Kopen
              </button>
            </div>
          </div>

          {/* Popular Choice */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-amber-400 p-6 relative shadow-amber-400/20 shadow-lg">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-amber-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">
              MOST POPULAR
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">🔥</div>
              <h3 className="text-xl font-bold text-amber-400 mb-2">Popular Choice</h3>
              <div className="text-3xl font-bold text-green-400 mb-2">1200 💰</div>
              <div className="text-2xl font-bold text-white mb-1">€10.00</div>
              <div className="text-sm text-slate-400 line-through mb-4">€12.00</div>
              <p className="text-slate-400 text-sm mb-6">+200 bonus coins</p>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-3 rounded-lg transition-all duration-200"
              >
                Kopen
              </button>
            </div>
          </div>

          {/* Best Value */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-amber-400/20 p-6 hover:border-amber-400/40 transition-all duration-200">
            <div className="text-center">
              <div className="text-3xl mb-4">💎</div>
              <h3 className="text-xl font-bold text-amber-400 mb-2">Best Value</h3>
              <div className="text-3xl font-bold text-green-400 mb-2">2500 💰</div>
              <div className="text-2xl font-bold text-white mb-1">€20.00</div>
              <div className="text-sm text-slate-400 line-through mb-4">€25.00</div>
              <p className="text-slate-400 text-sm mb-6">+500 bonus coins</p>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-lg transition-all duration-200"
              >
                Kopen
              </button>
            </div>
          </div>

          {/* Mega Pack */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-amber-400/20 p-6 hover:border-amber-400/40 transition-all duration-200">
            <div className="text-center">
              <div className="text-3xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-amber-400 mb-2">Mega Pack</h3>
              <div className="text-3xl font-bold text-green-400 mb-2">5000 💰</div>
              <div className="text-2xl font-bold text-white mb-1">€35.00</div>
              <div className="text-sm text-slate-400 line-through mb-4">€50.00</div>
              <p className="text-slate-400 text-sm mb-6">+1000 bonus coins</p>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-bold py-3 rounded-lg transition-all duration-200"
              >
                Kopen
              </button>
            </div>
          </div>

          {/* Ultimate */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-amber-400/20 p-6 hover:border-amber-400/40 transition-all duration-200">
            <div className="text-center">
              <div className="text-3xl mb-4">👑</div>
              <h3 className="text-xl font-bold text-amber-400 mb-2">Ultimate</h3>
              <div className="text-3xl font-bold text-green-400 mb-2">10000 💰</div>
              <div className="text-2xl font-bold text-white mb-1">€60.00</div>
              <div className="text-sm text-slate-400 line-through mb-4">€100.00</div>
              <p className="text-slate-400 text-sm mb-6">+2000 bonus coins</p>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-lg transition-all duration-200"
              >
                Kopen
              </button>
            </div>
          </div>

          {/* Free Daily Bonus */}
          <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-green-400/20 p-6 hover:border-green-400/40 transition-all duration-200">
            <div className="text-center">
              <div className="text-3xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Daily Bonus</h3>
              <div className="text-3xl font-bold text-green-400 mb-2">100 💰</div>
              <div className="text-2xl font-bold text-green-400 mb-4">GRATIS</div>
              <p className="text-slate-400 text-sm mb-6">Iedere 24 uur beschikbaar</p>
              <button 
                onClick={() => alert('Daily bonus claimed! +100 coins')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 rounded-lg transition-all duration-200"
              >
                Claim Bonus
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-blue-900/20 border border-blue-400/30 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">ℹ️</span>
            <h3 className="text-xl font-bold text-blue-400">Betalingsinformatie</h3>
          </div>
          <p className="text-blue-200 text-sm mb-4">
            Alle aankopen worden veilig verwerkt. Tokens worden direct na betaling toegevoegd aan je account.
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-slate-400">
            <span>💳 Creditcard</span>
            <span>🏦 iDEAL</span>
            <span>💰 PayPal</span>
            <span>🔒 SSL Beveiligd</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage; 