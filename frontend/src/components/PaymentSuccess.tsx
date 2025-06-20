import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Coins, Crown, ArrowRight } from 'lucide-react';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');
  const packageId = searchParams.get('package');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/payment/success?session_id=${sessionId}`);
        const data = await response.json();
        setPaymentData(data);
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  const getPackageInfo = (packageId: string | null) => {
    if (!packageId) return null;

    const packageMap: Record<string, any> = {
      'starter_pack': { name: 'Starter Pack', coins: 500, icon: '💎' },
      'popular_choice': { name: 'Popular Choice', coins: 1200, icon: '⭐' },
      'value_bundle': { name: 'Value Bundle', coins: 2500, icon: '🚀' },
      'premium_pack': { name: 'Premium Pack', coins: 6500, icon: '👑' },
      'whale_package': { name: 'Whale Package', coins: 15000, icon: '🐋' },
      'premium_monthly': { name: 'Premium Monthly', type: 'premium', icon: '👑' },
      'premium_yearly': { name: 'Premium Yearly', type: 'premium', icon: '👑' }
    };

    return packageMap[packageId] || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Betaling verifiëren...</p>
        </div>
      </div>
    );
  }

  const packageInfo = getPackageInfo(packageId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative">
            <div className="mx-auto w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-green-300 rounded-full animate-ping opacity-20"></div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">Betaling Gelukt! 🎉</h1>
          <p className="text-gray-300">Je aankoop is succesvol verwerkt</p>
        </div>

        {/* Package Info */}
        {packageInfo && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 mb-6 border border-green-500/30">
            <div className="text-center">
              <div className="text-4xl mb-3">{packageInfo.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{packageInfo.name}</h3>
              
              {packageInfo.coins && (
                <div className="flex items-center justify-center gap-2 text-yellow-400 text-lg">
                  <Coins className="w-5 h-5" />
                  <span className="font-bold">+{packageInfo.coins.toLocaleString()} coins</span>
                </div>
              )}
              
              {packageInfo.type === 'premium' && (
                <div className="flex items-center justify-center gap-2 text-purple-400 text-lg">
                  <Crown className="w-5 h-5" />
                  <span className="font-bold">Premium Toegang</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Status */}
        {paymentData && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Betaling Status:</span>
              <span className="text-green-400 font-medium">
                {paymentData.payment_status === 'paid' ? '✅ Betaald' : paymentData.payment_status}
              </span>
            </div>
            {sessionId && (
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-400">Sessie ID:</span>
                <span className="text-gray-300 font-mono text-xs">{sessionId.slice(-8)}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/game')}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>Start Spelen</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-xl transition-all"
          >
            Bekijk Profiel
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>🔒 Je betaling is veilig verwerkt via Stripe</p>
          <p className="mt-1">Coins zijn direct beschikbaar in je account</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 