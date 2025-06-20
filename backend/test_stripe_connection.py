#!/usr/bin/env python3
"""
Test script voor Stripe MCP verbinding en producten
"""

import stripe
import os
from dotenv import load_dotenv

def test_stripe_connection():
    """Test de Stripe verbinding en producten"""
    
    # Laad environment variabelen
    load_dotenv()
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    
    if not stripe.api_key:
        print('❌ Geen Stripe API key gevonden in .env')
        return False
    
    print('🔑 Stripe API key gevonden')
    print('🧪 Testen van Stripe verbinding...')
    
    try:
        # Test de verbinding
        account = stripe.Account.retrieve()
        display_name = getattr(account, 'display_name', '') or getattr(account, 'email', 'Unknown')
        print(f'✅ Verbonden met Stripe account: {display_name}')
        print(f'📧 Account email: {getattr(account, "email", "N/A")}')
        print(f'🌍 Land: {getattr(account, "country", "N/A")}')
        print(f'💰 Valuta: {getattr(account, "default_currency", "eur")}')
        
        # Haal producten op
        products = stripe.Product.list(limit=20)
        print(f'\n📦 Aantal producten: {len(products.data)}')
        
        coin_products = []
        premium_products = []
        
        for product in products.data:
            print(f'  - {product.name} (ID: {product.id})')
            if 'coins' in product.metadata.get('type', '').lower():
                coin_products.append(product)
            elif 'premium' in product.metadata.get('type', '').lower():
                premium_products.append(product)
        
        print(f'\n🪙 Coin producten: {len(coin_products)}')
        print(f'⭐ Premium producten: {len(premium_products)}')
        
        # Haal prijzen op
        prices = stripe.Price.list(limit=20)
        print(f'\n💵 Aantal prijzen: {len(prices.data)}')
        
        for price in prices.data:
            amount = price.unit_amount / 100 if price.unit_amount else 0
            recurring = " (recurring)" if price.recurring else ""
            print(f'  - €{amount} {price.currency.upper()}{recurring} ({price.id})')
        
        # Test checkout sessie aanmaken
        print('\n🛒 Testen checkout sessie...')
        
        if prices.data:
            test_price = prices.data[0]
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': test_price.id,
                    'quantity': 1,
                }],
                mode='payment' if not test_price.recurring else 'subscription',
                success_url='http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:3000/payment/cancel',
            )
            print(f'✅ Checkout sessie aangemaakt: {session.id}')
            print(f'🔗 Checkout URL: {session.url}')
        
        print('\n🎉 Alle tests succesvol!')
        return True
        
    except Exception as e:
        print(f'❌ Fout: {e}')
        return False

if __name__ == '__main__':
    test_stripe_connection() 