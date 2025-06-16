#!/usr/bin/env python3
"""
Test script voor Stripe integratie
"""

import stripe
from stripe_service import StripeService, PackageType
import os

# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
stripe.api_key = os.getenv("STRIPE_API_KEY")

def test_stripe_service():
    """Test de StripeService configuratie"""
    
    print("🧪 TESTEN VAN STRIPE SERVICE...")
    print("=" * 50)
    
    service = StripeService()
    
    # Test coin packages
    print("\n💰 COIN PACKAGES:")
    for package_id, package in service.coin_packages.items():
        print(f"✅ {package.name}")
        print(f"   ID: {package.id}")
        print(f"   Coins: {package.coins}")
        print(f"   Prijs: €{package.price_eur}")
        print(f"   Stripe Price ID: {package.stripe_price_id}")
        print("")
    
    # Test premium packages
    print("👑 PREMIUM PACKAGES:")
    for package_id, package in service.premium_packages.items():
        print(f"✅ {package.name}")
        print(f"   ID: {package.id}")
        print(f"   Prijs: €{package.price_eur}/{package.interval}")
        print(f"   Stripe Price ID: {package.stripe_price_id}")
        print("")

def test_checkout_session_creation():
    """Test het aanmaken van checkout sessies"""
    
    print("🛒 TESTEN VAN CHECKOUT SESSIES...")
    print("=" * 50)
    
    service = StripeService()
    
    # Test coin package checkout
    try:
        session = service.create_checkout_session(
            package_id="starter",
            package_type=PackageType.COINS,
            success_url="http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:3000/payment/cancel",
            customer_email="test@example.com",
            user_id="test_user_123"
        )
        
        print("✅ Coin package checkout sessie aangemaakt:")
        print(f"   Session ID: {session['id']}")
        print(f"   URL: {session['url']}")
        print("")
        
    except Exception as e:
        print(f"❌ Fout bij coin checkout: {e}")
    
    # Test premium package checkout
    try:
        session = service.create_checkout_session(
            package_id="premium_monthly",
            package_type=PackageType.PREMIUM_MONTHLY,
            success_url="http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:3000/payment/cancel",
            customer_email="test@example.com",
            user_id="test_user_123"
        )
        
        print("✅ Premium package checkout sessie aangemaakt:")
        print(f"   Session ID: {session['id']}")
        print(f"   URL: {session['url']}")
        print("")
        
    except Exception as e:
        print(f"❌ Fout bij premium checkout: {e}")

def verify_stripe_products():
    """Verifieer dat alle producten bestaan in Stripe"""
    
    print("🔍 VERIFICATIE VAN STRIPE PRODUCTEN...")
    print("=" * 50)
    
    service = StripeService()
    
    # Verifieer coin packages
    print("\n💰 VERIFICATIE COIN PACKAGES:")
    for package_id, package in service.coin_packages.items():
        try:
            price = stripe.Price.retrieve(package.stripe_price_id)
            product = stripe.Product.retrieve(price.product)
            
            print(f"✅ {package.name}")
            print(f"   Stripe Product: {product.name}")
            print(f"   Stripe Prijs: €{price.unit_amount/100}")
            print("")
            
        except Exception as e:
            print(f"❌ Fout bij verificatie {package.name}: {e}")
    
    # Verifieer premium packages
    print("👑 VERIFICATIE PREMIUM PACKAGES:")
    for package_id, package in service.premium_packages.items():
        try:
            price = stripe.Price.retrieve(package.stripe_price_id)
            product = stripe.Product.retrieve(price.product)
            
            print(f"✅ {package.name}")
            print(f"   Stripe Product: {product.name}")
            print(f"   Stripe Prijs: €{price.unit_amount/100}/{price.recurring.interval}")
            print("")
            
        except Exception as e:
            print(f"❌ Fout bij verificatie {package.name}: {e}")

def main():
    """Hoofdfunctie"""
    print("🚀 STRIPE INTEGRATIE TEST")
    print("=" * 60)
    
    try:
        test_stripe_service()
        verify_stripe_products()
        test_checkout_session_creation()
        
        print("=" * 60)
        print("✅ ALLE TESTS SUCCESVOL VOLTOOID!")
        print("\n🎉 Je Stripe integratie is klaar voor gebruik!")
        
    except Exception as e:
        print(f"❌ Test gefaald: {e}")

if __name__ == "__main__":
    main() 