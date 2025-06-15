import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedCoinCounter from './AnimatedCoinCounter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { Store, Gem, Star, Rocket } from 'lucide-react';
import { useCurrentUser } from 'app';
import { usePlayerProgressStore } from '../utils/usePlayerProgressStore';

interface CoinBalanceWalletProps {
  balance: number;
}

const coinPackages = [
  {
    id: "starter",
    name: "Starter Pack",
    amount: 500,
    price: 5.00,
    icon: <Gem className="w-8 h-8 text-cyan-400" />,
    bgColor: "bg-cyan-900/20",
    borderColor: "border-cyan-500/30",
  },
  {
    id: "popular",
    name: "Popular Choice",
    amount: 1200,
    price: 10.00,
    original_price: 12.00,
    icon: <Star className="w-8 h-8 text-yellow-400" />,
    bgColor: "bg-yellow-900/20",
    borderColor: "border-yellow-500/30",
    isPopular: true,
  },
  {
    id: "value",
    name: "Value Bundle",
    amount: 2500,
    price: 20.00,
    original_price: 25.00,
    icon: <Rocket className="w-8 h-8 text-red-500" />,
    bgColor: "bg-red-900/20",
    borderColor: "border-red-500/30",
  },
];

export const CoinBalanceWallet: React.FC<CoinBalanceWalletProps> = ({ balance }) => {
  const [isShopOpen, setIsShopOpen] = useState(false);
  const navigate = useNavigate();
  const { user: currentUser } = useCurrentUser();
  const { updatePlayerCoins } = usePlayerProgressStore();

  const handlePurchase = async (packageId: string, amount: number) => {
    if (!currentUser?.uid) {
      alert("Je moet ingelogd zijn om een aankoop te doen.");
      return;
    }

    try {
      // Import PaymentService dynamically
      const { PaymentService } = await import('../services/paymentService');
      
      // Maak Stripe checkout sessie aan
      const response = await PaymentService.createCheckoutSession({
        package_id: packageId,
        package_type: 'coins',
        user_id: currentUser.uid,
        success_url: window.location.origin + '/payment/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: window.location.origin + '/payment/cancel'
      });

      // Redirect naar Stripe Checkout
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error('Geen checkout URL ontvangen van de server');
      }
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Er ging iets mis bij het starten van de betaling. Probeer het opnieuw.');
    }
  };

  const handleGoToShop = () => {
    setIsShopOpen(false);
    navigate('/shop');
  };

  return (
    <>
      <button 
        onClick={() => setIsShopOpen(true)}
        onTouchStart={(e) => {
          // Prevent touch delays on mobile
          e.currentTarget.style.opacity = '0.8';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        className="coin-balance-wallet flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 bg-green-800/40 hover:bg-green-700/60 border-green-400/10 hover:border-green-400/30 text-green-300/80 hover:text-green-200 touch-manipulation cursor-pointer relative z-50"
        style={{
          touchAction: 'manipulation',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          minHeight: '44px',
          minWidth: '44px'
        }}
        aria-label="Open token wallet"
      >
        <AnimatedCoinCounter endValue={balance} />
        <span className="text-xl opacity-80">💰</span>
      </button>

      <Dialog open={isShopOpen} onOpenChange={setIsShopOpen}>
        <DialogContent className="sm:max-w-2xl bg-slate-900/90 border-amber-500/20 backdrop-blur-lg text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-400 flex items-center">
              <Store className="mr-3" />
              Quick Top-up
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-2">
              Choose a package to quickly recharge your balance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
            {coinPackages.map((pkg) => (
              <div key={pkg.name} className={`relative rounded-xl p-6 border-2 ${pkg.borderColor} ${pkg.bgColor} flex flex-col items-center text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20`}>
                {pkg.isPopular && (
                  <div className="absolute -top-3 -right-3 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full transform rotate-12">
                    POPULAR
                  </div>
                )}
                <div className="mb-4">{pkg.icon}</div>
                <h3 className="text-xl font-bold text-slate-100">{pkg.name}</h3>
                <p className="text-3xl font-bold text-amber-300 my-2">
                  {pkg.amount.toLocaleString()}
                </p>
                <p className="text-lg text-slate-300 font-medium mb-4">
                  for €{pkg.price.toFixed(2)}
                </p>
                <Button 
                  onClick={() => handlePurchase(pkg.id, pkg.amount)}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:from-amber-400 hover:to-yellow-400"
                >
                  Buy Now
                </Button>
              </div>
            ))}
          </div>
          
          <DialogFooter className="border-t border-amber-500/10 pt-4 sm:justify-center">
            <p className="text-sm text-slate-400">
              Need more options?{" "}
              <button onClick={handleGoToShop} className="font-semibold text-amber-400 hover:text-amber-300 underline">
                Visit the full Token Shop
              </button>
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 