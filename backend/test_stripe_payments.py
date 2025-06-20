#!/usr/bin/env python3
"""
Script om test betalingen uit te voeren met Stripe test cards
"""

import stripe
import os
from stripe_service import StripeService, PackageType

# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
stripe.api_key = os.getenv("STRIPE_API_KEY")

# Stripe test cards voor verschillende scenario's
TEST_CARDS = {
    "success": {
        "card": "4242424242424242",
        "name": "Succesvolle betaling",
        "description": "Standaard succesvolle betaling"
    },
    "visa": {
        "card": "4000000000000002", 
        "name": "Visa declined",
        "description": "Visa kaart die wordt geweigerd"
    },
    "mastercard": {
        "card": "5555555555554444",
        "name": "Mastercard success",
        "description": "Succesvolle Mastercard betaling"
    },
    "amex": {
        "card": "378282246310005",
        "name": "American Express",
        "description": "Succesvolle American Express betaling"
    },
    "declined": {
        "card": "4000000000000002",
        "name": "Declined card", 
        "description": "Kaart wordt geweigerd door bank"
    },
    "insufficient_funds": {
        "card": "4000000000009995",
        "name": "Insufficient funds",
        "description": "Onvoldoende saldo"
    },
    "incorrect_cvc": {
        "card": "4000000000000127",
        "name": "Incorrect CVC",
        "description": "Verkeerde CVC code"
    },
    "expired_card": {
        "card": "4000000000000069",
        "name": "Expired card",
        "description": "Verlopen kaart"
    },
    "processing_error": {
        "card": "4000000000000119",
        "name": "Processing error", 
        "description": "Verwerkingsfout"
    },
    "3d_secure": {
        "card": "4000000000003220",
        "name": "3D Secure required",
        "description": "Vereist 3D Secure authenticatie"
    }
}

def display_test_cards():
    """Toon alle beschikbare test cards"""
    
    print("💳 STRIPE TEST CARDS")
    print("=" * 80)
    print("Gebruik deze test card nummers om verschillende scenario's te testen:\n")
    
    for key, card_info in TEST_CARDS.items():
        print(f"🔸 {card_info['name']}")
        print(f"   Nummer: {card_info['card']}")
        print(f"   Scenario: {card_info['description']}")
        print()
    
    print("ℹ️  Extra test informatie:")
    print("   • Vervaldatum: Gebruik elke toekomstige datum (bv. 12/25)")
    print("   • CVC: Gebruik elke 3-cijferige code (bv. 123)")
    print("   • Postcode: Gebruik elke geldige postcode")
    print()

def create_test_checkout_sessions():
    """Maak test checkout sessies aan voor verschillende packages"""
    
    print("🛒 TEST CHECKOUT SESSIES AANMAKEN")
    print("=" * 80)
    
    service = StripeService()
    
    # Test URLs voor adultsplaystore.com
    success_url = "https://www.adultsplaystore.com/payment/success?session_id={CHECKOUT_SESSION_ID}"
    cancel_url = "https://www.adultsplaystore.com/payment/cancel"
    
    test_cases = [
        {
            "name": "Starter Pack (Coins)",
            "package_id": "starter", 
            "package_type": PackageType.COINS,
            "email": "test+coins@adultsplaystore.com"
        },
        {
            "name": "Popular Choice (Coins)",
            "package_id": "popular",
            "package_type": PackageType.COINS, 
            "email": "test+popular@adultsplaystore.com"
        },
        {
            "name": "Premium Monthly (Subscription)",
            "package_id": "premium_monthly",
            "package_type": PackageType.PREMIUM_MONTHLY,
            "email": "test+premium@adultsplaystore.com"
        },
        {
            "name": "Premium Yearly (Subscription)", 
            "package_id": "premium_yearly",
            "package_type": PackageType.PREMIUM_YEARLY,
            "email": "test+yearly@adultsplaystore.com"
        }
    ]
    
    checkout_urls = []
    
    for test_case in test_cases:
        try:
            session = service.create_checkout_session(
                package_id=test_case["package_id"],
                package_type=test_case["package_type"],
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=test_case["email"],
                user_id=f"test_user_{test_case['package_id']}"
            )
            
            checkout_urls.append({
                "name": test_case["name"],
                "url": session["url"],
                "session_id": session["id"]
            })
            
            print(f"✅ {test_case['name']}")
            print(f"   Session ID: {session['id']}")
            print(f"   Checkout URL: {session['url']}")
            print()
            
        except Exception as e:
            print(f"❌ Fout bij {test_case['name']}: {e}")
    
    return checkout_urls

def create_test_payment_demo():
    """Demonstreer het aanmaken van een test betaling"""
    
    print("🧪 TEST BETALING DEMONSTRATIE")
    print("=" * 80)
    
    try:
        # Maak een test Payment Intent aan
        payment_intent = stripe.PaymentIntent.create(
            amount=500,  # €5.00 in cents
            currency='eur',
            automatic_payment_methods={
                'enabled': True,
            },
            metadata={
                'package_id': 'starter',
                'user_id': 'test_user_demo',
                'coins': '500'
            }
        )
        
        print(f"✅ Test Payment Intent aangemaakt:")
        print(f"   ID: {payment_intent.id}")
        print(f"   Bedrag: €{payment_intent.amount/100}")
        print(f"   Status: {payment_intent.status}")
        print(f"   Client Secret: {payment_intent.client_secret}")
        print()
        
        return payment_intent
        
    except Exception as e:
        print(f"❌ Fout bij aanmaken test betaling: {e}")
        return None

def main():
    """Hoofdfunctie"""
    print("🚀 STRIPE TEST BETALINGEN SETUP")
    print("=" * 80)
    
    # Toon test cards
    display_test_cards()
    
    # Maak test checkout sessies aan
    checkout_urls = create_test_checkout_sessions()
    
    # Test betaling demonstratie
    test_payment = create_test_payment_demo()
    
    print("=" * 80)
    print("✅ TEST SETUP VOLTOOID!")
    
    if checkout_urls:
        print(f"\n🔗 CHECKOUT URLs VOOR TESTING:")
        for checkout in checkout_urls:
            print(f"   • {checkout['name']}: {checkout['url']}")
    
    print(f"\n📝 TESTING STAPPEN:")
    print("1. Gebruik een van de bovenstaande checkout URLs")
    print("2. Vul een test card nummer in (zie lijst hierboven)")
    print("3. Gebruik een toekomstige vervaldatum (bv. 12/25)")
    print("4. Gebruik een willekeurige 3-cijferige CVC (bv. 123)")
    print("5. Voltooi de betaling en bekijk het resultaat")
    
    print(f"\n🎯 MEEST GEBRUIKTE TEST CARDS:")
    print("   • Succesvolle betaling: 4242424242424242")
    print("   • Geweigerde betaling: 4000000000000002") 
    print("   • 3D Secure test: 4000000000003220")

if __name__ == "__main__":
    main() 