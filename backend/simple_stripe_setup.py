#!/usr/bin/env python3
"""
Eenvoudig script om Stripe producten aan te maken
"""

import stripe
import os

# Set your secret key. Remember to switch to your live secret key in production.
# See your keys here: https://dashboard.stripe.com/apikeys
stripe.api_key = os.getenv("STRIPE_API_KEY")

def create_coin_products():
    """Maak coin pakketten aan in Stripe"""
    
    coin_packages = [
        {
            "id": "starter",
            "name": "Starter Pack",
            "coins": 500,
            "price_eur": 5.00,
            "description": "Perfect om te beginnen - 500 coins"
        },
        {
            "id": "popular", 
            "name": "Popular Choice",
            "coins": 1200,
            "price_eur": 10.00,
            "description": "Popular Choice - 1200 coins + 20% Bonus!"
        },
        {
            "id": "value",
            "name": "Value Bundle", 
            "coins": 2500,
            "price_eur": 20.00,
            "description": "Value Bundle - 2500 coins, Best Value Per Coin"
        },
        {
            "id": "premium",
            "name": "Premium Stash",
            "coins": 6500, 
            "price_eur": 50.00,
            "description": "Premium Stash - 6500 coins + Huge Bonus + VIP Tag"
        },
        {
            "id": "whale",
            "name": "Whale Package",
            "coins": 15000,
            "price_eur": 100.00,
            "description": "Whale Package - 15000 coins, The Ultimate Experience"
        }
    ]
    
    created_products = []
    
    for package in coin_packages:
        try:
            # Maak product aan
            product = stripe.Product.create(
                name=package["name"],
                description=package["description"],
                metadata={
                    "type": "coins",
                    "coins": str(package["coins"]),
                    "package_id": package["id"]
                }
            )
            
            # Maak prijs aan  
            price = stripe.Price.create(
                product=product.id,
                unit_amount=int(package["price_eur"] * 100), # Euros naar cents
                currency="eur"
            )
            
            created_products.append({
                "package_id": package["id"],
                "name": package["name"],
                "product_id": product.id,
                "price_id": price.id,
                "price": package["price_eur"],
                "coins": package["coins"]
            })
            
            print(f"✅ Coin package aangemaakt: {package['name']}")
            print(f"   Product ID: {product.id}")
            print(f"   Price ID: {price.id}")
            print(f"   Prijs: €{package['price_eur']} voor {package['coins']} coins")
            print("")
            
        except Exception as e:
            print(f"❌ Fout bij aanmaken {package['name']}: {e}")
    
    return created_products

def create_premium_products():
    """Maak premium abonnement producten aan"""
    
    premium_packages = [
        {
            "id": "premium_monthly",
            "name": "Premium Maandelijks",
            "price_eur": 9.99,
            "interval": "month",
            "description": "Premium Maandelijks - Unlimited dealer chats, Exclusive outfits, Daily bonus coins"
        },
        {
            "id": "premium_yearly",
            "name": "Premium Jaarlijks", 
            "price_eur": 99.99,
            "interval": "year",
            "description": "Premium Jaarlijks - Alle Premium voordelen + 2 maanden gratis + Exclusive annual rewards"
        }
    ]
    
    created_products = []
    
    for package in premium_packages:
        try:
            # Maak product aan
            product = stripe.Product.create(
                name=package["name"],
                description=package["description"],
                metadata={
                    "type": "premium_subscription",
                    "interval": package["interval"],
                    "package_id": package["id"]
                }
            )
            
            # Maak recurring prijs aan
            price = stripe.Price.create(
                product=product.id,
                unit_amount=int(package["price_eur"] * 100), # Euros naar cents
                currency="eur",
                recurring={"interval": package["interval"]}
            )
            
            created_products.append({
                "package_id": package["id"],
                "name": package["name"],
                "product_id": product.id,
                "price_id": price.id,
                "price": package["price_eur"],
                "interval": package["interval"]
            })
            
            print(f"✅ Premium package aangemaakt: {package['name']}")
            print(f"   Product ID: {product.id}")
            print(f"   Price ID: {price.id}")
            print(f"   Prijs: €{package['price_eur']} per {package['interval']}")
            print("")
            
        except Exception as e:
            print(f"❌ Fout bij aanmaken {package['name']}: {e}")
    
    return created_products

def main():
    """Hoofdfunctie"""
    print("🚀 Bezig met aanmaken van alle Stripe producten...")
    print("=" * 60)
    
    try:
        print("\n💰 COIN PACKAGES AANMAKEN...")
        coin_products = create_coin_products()
        
        print("\n👑 PREMIUM PACKAGES AANMAKEN...")
        premium_products = create_premium_products()
        
        print("=" * 60)
        print("✅ ALLE PRODUCTEN SUCCESVOL AANGEMAAKT!")
        
        print(f"\n📊 SAMENVATTING:")
        print(f"   • {len(coin_products)} coin packages aangemaakt")
        print(f"   • {len(premium_products)} premium packages aangemaakt")
        
        print(f"\n🔑 PRICE IDs voor je applicatie:")
        print("// Coin packages")
        for product in coin_products:
            print(f'"{product["package_id"]}": "{product["price_id"]}", // {product["name"]} - €{product["price"]} - {product["coins"]} coins')
        
        print("\n// Premium packages")  
        for product in premium_products:
            print(f'"{product["package_id"]}": "{product["price_id"]}", // {product["name"]} - €{product["price"]}/{product["interval"]}')
        
        print(f"\n🎉 Je kunt deze Price IDs nu gebruiken in je stripe_service.py!")
        
    except Exception as e:
        print(f"❌ Algemene fout: {e}")
        print("Controleer je Stripe API key en internetverbinding")

if __name__ == "__main__":
    main() 