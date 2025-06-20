#!/usr/bin/env python3
"""
Script om alle benodigde Stripe producten aan te maken voor de Lucky Flirty Chat applicatie
"""

import asyncio
import os
from dotenv import load_dotenv
from stripe_service import StripeService
import stripe

# Laad environment variabelen  
load_dotenv()

async def main():
    """Hoofdfunctie om alle Stripe producten aan te maken"""
    
    # Check of Stripe API key is geconfigureerd
    stripe_key = os.getenv('STRIPE_SECRET_KEY')
    if not stripe_key:
        print("❌ STRIPE_SECRET_KEY niet gevonden in environment variabelen")
        print("Voeg je Stripe secret key toe aan je .env bestand:")
        print("STRIPE_SECRET_KEY=sk_test_...")
        return
    
    print("🚀 Bezig met aanmaken van Stripe producten...")
    print(f"API Key: {stripe_key[:12]}...")
    print("-" * 50)
    
    # Initialiseer Stripe service
    service = StripeService()
    
    try:
        # Maak alle producten aan
        await service.create_stripe_products()
        
        print("-" * 50)
        print("✅ Alle Stripe producten succesvol aangemaakt!")
        print("\n📋 Overzicht van aangemaakt producten:")
        
        # Print coin packages
        print("\n💰 COIN PACKAGES:")
        for package in service.coin_packages.values():
            if package.stripe_price_id:
                print(f"  • {package.name}: €{package.price_eur} ({package.coins} coins)")
                print(f"    Price ID: {package.stripe_price_id}")
        
        # Print premium packages  
        print("\n👑 PREMIUM PACKAGES:")
        for package in service.premium_packages.values():
            if package.stripe_price_id:
                print(f"  • {package.name}: €{package.price_eur}/{package.interval}")
                print(f"    Price ID: {package.stripe_price_id}")
        
        print("\n🔗 Je kunt deze Price IDs nu gebruiken in je applicatie!")
        
    except Exception as e:
        print(f"❌ Fout bij aanmaken producten: {e}")
        print("Controleer je Stripe API key en internetverbinding")

if __name__ == "__main__":
    asyncio.run(main()) 