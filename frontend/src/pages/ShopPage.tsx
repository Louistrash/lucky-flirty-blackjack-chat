import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { usePlayerProgressStore } from '../utils/usePlayerProgressStore';
import { PaymentService, type CoinPackage, type PremiumPackage } from '../services/paymentService';
import { useCurrentUser } from "app";

const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();
  const { playerData } = usePlayerProgressStore();
  const playerBalance = playerData?.playerCoins ?? 0;

  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setIsLoading(true);
        const { coin_packages, premium_packages } = await PaymentService.getPackages();
        setCoinPackages(coin_packages);
        setPremiumPackages(premium_packages);
        setError(null);
      } catch (err) {
        setError("Failed to load packages. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handlePurchase = async (packageId: string, packageType: 'coins' | 'premium_monthly' | 'premium_yearly') => {
    if (!currentUser) {
      alert("Please log in to make a purchase.");
      navigate('/login');
      return;
    }

    setIsProcessing(packageId);
    try {
      const response = await PaymentService.createCheckoutSession({
        package_id: packageId,
        package_type: packageType,
        user_id: currentUser.uid,
      });

      if (response.checkout_url) {
        PaymentService.redirectToCheckout(response.checkout_url);
      } else {
        throw new Error("No checkout URL received.");
      }
    } catch (err) {
      alert(`Payment failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading packages...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900 relative"
      style={{
        backgroundImage: 'url("/casino-pattern.png")',
        backgroundSize: '400px 400px',
        backgroundRepeat: 'repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay voor betere leesbaarheid */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-green-800/80 to-emerald-900/80"></div>
      
      <div className="relative z-10">
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
          {coinPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`bg-slate-900/95 backdrop-blur-md rounded-xl border p-6 transition-all duration-200 shadow-2xl hover:shadow-3xl ${
                pkg.is_popular ? 'border-amber-400 shadow-amber-400/30 shadow-2xl ring-2 ring-amber-400/20' : 'border-amber-400/30 hover:border-amber-400/50 hover:shadow-amber-400/10'
              }`}
            >
              {pkg.is_popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-amber-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-amber-400 mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold text-green-400 mb-2">{pkg.coins} 💰</div>
                <div className="text-2xl font-bold text-white mb-1">{PaymentService.formatPrice(pkg.price_eur)}</div>
                {pkg.original_price_eur && (
                   <div className="text-sm text-slate-400 line-through mb-4">{PaymentService.formatPrice(pkg.original_price_eur)}</div>
                )}
                <p className="text-slate-400 text-sm mb-6">{pkg.bonus_description || ' '}</p>
                <button 
                  onClick={() => handlePurchase(pkg.id, 'coins')}
                  disabled={isProcessing === pkg.id}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {isProcessing === pkg.id ? 'Processing...' : 'Kopen'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-blue-900/30 backdrop-blur-md border border-blue-400/40 rounded-xl p-6 text-center shadow-2xl">
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
    </div>
  );
};

export default ShopPage; 