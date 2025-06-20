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

// Use a fallback key for development if environment variable is not set
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OTBVbJDYzwGDuiJkNlrHCwGZGQfLhXQbMSVhZDYzwGDuiJkNlrHCwGZ';

// Log the Stripe key for debugging (redacted for security)
console.log(`Stripe key loaded: ${STRIPE_PUBLIC_KEY.substring(0, 8)}...`);

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

export class PaymentService {
  
  /**
   * Haal alle beschikbare pakketten op
   */
  static async getPackages(): Promise<PaymentPackages> {
    const response = await fetch(`${__API_URL__}/api/payments/packages`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch packages');
    }
    
    const data = await response.json();
    
    // Check if the response has a success field and extract the data
    const responseData = data.success ? data : { coin_packages: data.coin_packages || [], premium_packages: data.premium_packages || [] };
    
    // Transform data to match our interface
    return {
      coin_packages: responseData.coin_packages.map((pkg: any) => ({
        ...pkg,
        type: 'coins' as const
      })),
      premium_packages: responseData.premium_packages.map((pkg: any) => ({
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
      console.log('Creating checkout session with request:', {
        ...request,
        user_id: request.user_id ? '(redacted)' : undefined // Don't log user ID
      });
      
      // Ensure we have a valid API URL
      const apiUrl = __API_URL__ || window.location.origin;
      console.log(`Using API URL: ${apiUrl}`);
      
      const response = await fetch(`${apiUrl}/api/payments/create-checkout`, {
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
        credentials: 'include', // Include cookies for authentication
      });

      console.log('Checkout response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
          console.error('Payment API error:', errorJson);
          throw new Error(errorJson.detail || `Failed to create checkout session: ${response.status}`);
        } catch (e) {
          console.error('Payment API returned non-JSON error:', errorText);
          throw new Error(`Failed to create checkout session: ${response.status} - ${errorText.substring(0, 100)}...`);
        }
      }

      const responseData = await response.json();
      console.log('Checkout session created successfully');
      return responseData;
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment error: ${error.message || 'Unknown error'}. Please try again later.`);
      throw error;
    }
  }

  /**
   * Haal gebruiker abonnementen op
   */
  static async getUserSubscriptions(userEmail: string): Promise<Subscription[]> {
    const response = await fetch(`${__API_URL__}/api/payments/subscriptions/${encodeURIComponent(userEmail)}`);
    
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
    const response = await fetch(`${__API_URL__}/api/setup-stripe`, {
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
