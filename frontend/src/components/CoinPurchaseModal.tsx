import React, { useState, useEffect } from 'react';
import { X, Star, Zap, Shield } from 'lucide-react';
import { PaymentService, CoinPackage, PremiumPackage } from '../services/paymentService';

interface CoinPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const CoinPurchaseModal: React.FC<CoinPurchaseModalProps> = ({
  isOpen,
  onClose,
  userId
}) => {
  const [loading, setLoading] = useState(false);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[]>([]);
  const [activeTab, setActiveTab] = useState<'coins' | 'premium'>('coins');
  const [processingPackage, setProcessingPackage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPackages();
    }
  }, [isOpen]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await PaymentService.getPackages();
      setCoinPackages(data.coin_packages);
      setPremiumPackages(data.premium_packages);
    } catch (error) {
      console.error('Failed to load packages:', error);
      alert('Er ging iets mis bij het laden van de pakketten. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageId: string, packageType: 'coins' | 'premium_monthly' | 'premium_yearly') => {
    try {
      setProcessingPackage(packageId);
      
      const checkoutResponse = await PaymentService.createCheckoutSession({
        package_id: packageId,
        package_type: packageType,
        user_id: userId,
        success_url: `${window.location.origin}/payment/success?package=${packageId}`,
        cancel_url: `${window.location.origin}/game`
      });

      // Redirect naar Stripe Checkout
      PaymentService.redirectToCheckout(checkoutResponse.checkout_url);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Er ging iets mis bij het starten van de betaling. Probeer het opnieuw.');
    } finally {
      setProcessingPackage(null);
    }
  };

  const getCoinPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'starter_pack': return '💎';
      case 'popular_choice': return '⭐';
      case 'value_bundle': return '🚀';
      case 'premium_pack': return '👑';
      case 'whale_package': return '🐋';
      default: return '💰';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative border border-yellow-600/30">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-600 to-amber-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="text-yellow-300" />
                Quick Top-up
              </h2>
              <p className="text-yellow-100 mt-1">Kies een pakket om snel je saldo aan te vullen.</p>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-yellow-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('coins')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'coins' 
                  ? 'bg-white text-yellow-600 shadow-lg' 
                  : 'bg-yellow-600/20 text-yellow-100 hover:bg-yellow-600/30'
              }`}
            >
              💰 Coins
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'premium' 
                  ? 'bg-white text-yellow-600 shadow-lg' 
                  : 'bg-yellow-600/20 text-yellow-100 hover:bg-yellow-600/30'
              }`}
            >
              👑 Premium
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
          ) : (
            <>
              {/* Coin Packages */}
              {activeTab === 'coins' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coinPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 transition-all hover:scale-105 hover:shadow-xl ${
                        pkg.is_popular ? 'border-yellow-500 shadow-yellow-500/20' : 'border-gray-600'
                      }`}
                    >
                      {pkg.is_popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                            POPULAIR
                          </span>
                        </div>
                      )}

                      <div className="text-center">
                        <div className="text-4xl mb-2">{getCoinPackageIcon(pkg.id)}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                        
                        <div className="text-3xl font-bold text-yellow-400 mb-1">
                          {pkg.coins.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400 mb-4">coins</div>

                        <div className="flex items-center justify-center gap-2 mb-4">
                          <span className="text-2xl font-bold text-white">
                            {PaymentService.formatPrice(pkg.price_eur)}
                          </span>
                          {pkg.original_price_eur && pkg.original_price_eur > pkg.price_eur && (
                            <span className="text-lg text-gray-400 line-through">
                              {PaymentService.formatPrice(pkg.original_price_eur)}
                            </span>
                          )}
                        </div>

                        {pkg.bonus_description && (
                          <div className="text-sm text-green-400 mb-4">
                            🎁 {pkg.bonus_description}
                          </div>
                        )}

                        <button
                          onClick={() => handlePurchase(pkg.id, 'coins')}
                          disabled={processingPackage === pkg.id}
                          className={`w-full py-3 rounded-lg font-bold text-black transition-all ${
                            pkg.is_popular
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600'
                              : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600'
                          } ${processingPackage === pkg.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                        >
                          {processingPackage === pkg.id ? 'Bezig...' : 'Buy Now'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Premium Packages */}
              {activeTab === 'premium' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {premiumPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-xl p-8 border-2 border-purple-500 shadow-purple-500/20 hover:scale-105 transition-all"
                    >
                      <div className="text-center mb-6">
                        <div className="text-5xl mb-4">👑</div>
                        <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                        <div className="text-3xl font-bold text-purple-300 mb-1">
                          {PaymentService.formatPrice(pkg.price_eur)}
                        </div>
                        <div className="text-purple-200">per {pkg.interval === 'month' ? 'maand' : 'jaar'}</div>
                      </div>

                      <div className="space-y-3 mb-8">
                        {pkg.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3 text-purple-100">
                            <Shield className="text-purple-400 w-5 h-5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handlePurchase(pkg.id, pkg.interval === 'month' ? 'premium_monthly' : 'premium_yearly')}
                        disabled={processingPackage === pkg.id}
                        className={`w-full py-4 rounded-lg font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all ${
                          processingPackage === pkg.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                        }`}
                      >
                        {processingPackage === pkg.id ? 'Bezig...' : 'Upgrade Now'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <p>💳 Veilige betaling via Stripe • 🔒 SSL versleuteld • ⚡ Direct beschikbaar</p>
            <p className="mt-2">Meer opties nodig? <button className="text-yellow-400 hover:text-yellow-300 underline">Bezoek de volledige Token Shop</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinPurchaseModal; 