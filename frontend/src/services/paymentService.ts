import { loadStripe } from '@stripe/stripe-js';

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price_eur: number;
  original_price_eur?: number;
  is_popular?: boolean;
  bonus_description?: string;
  type: 'coins';
}

export interface PremiumPackage {
  id: string;
  name: string;
  price_eur: number;
  interval: string;
  features: string[];
  type: 'premium';
}

export interface PaymentPackages {
  coin_packages: CoinPackage[];
  premium_packages: PremiumPackage[];
}

export interface CheckoutRequest {
  package_id: string;
  package_type: 'coins' | 'premium_monthly' | 'premium_yearly';
  user_id?: string;
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface Subscription {
  id: string;
  status: string;
  current_period_end: number;
  plan_name: string;
}

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

export class PaymentService {
  
  /**
   * Haal alle beschikbare pakketten op
   */
  static async getPackages(): Promise<PaymentPackages> {
    const response = await fetch(`${__API_URL__}/api/packages`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch packages');
    }
    
    const data = await response.json();
    
    // Transform data to match our interface
    return {
      coin_packages: data.coin_packages.map((pkg: any) => ({
        ...pkg,
        type: 'coins' as const
      })),
      premium_packages: data.premium_packages.map((pkg: any) => ({
        ...pkg,
        type: 'premium' as const
      }))
    };
  }

  /**
   * Maak een Stripe Checkout sessie aan
   */
  static async createCheckoutSession(request: CheckoutRequest) {
    try {
      const response = await fetch(`${__API_URL__}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_id: request.package_id,
          package_type: request.package_type,
          user_id: request.user_id,
          success_url: window.location.origin + '/payment/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: window.location.origin + '/payment/cancel'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create checkout session');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  }

  /**
   * Haal gebruiker abonnementen op
   */
  static async getUserSubscriptions(userEmail: string): Promise<Subscription[]> {
    const response = await fetch(`${__API_URL__}/payments/subscriptions/${encodeURIComponent(userEmail)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }
    
    const data = await response.json();
    return data.subscriptions;
  }

  /**
   * Setup Stripe producten (admin only)
   */
  static async setupStripeProducts(): Promise<{ message: string }> {
    const response = await fetch(`${__API_URL__}/setup-stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to setup Stripe products');
    }

    return response.json();
  }

  /**
   * Redirect naar Stripe Checkout
   */
  static redirectToCheckout(checkoutUrl: string): void {
    window.location.href = checkoutUrl;
  }

  /**
   * Format prijs voor weergave
   */
  static formatPrice(price: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }

  /**
   * Bereken korting percentage
   */
  static calculateDiscountPercentage(originalPrice: number, currentPrice: number): number {
    if (!originalPrice || originalPrice <= currentPrice) {
      return 0;
    }
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
} 