#!/usr/bin/env python3
"""
Quick test voor checkout URLs
"""
import stripe
import os

# Set API key
stripe.api_key = os.getenv("STRIPE_API_KEY")

# Package configurations
packages = {
    # Coin packages
    "starter_pack": {
        "name": "Starter Pack", 
        "price_id": "price_1RYSePIhYvmNDX3Mk7LUVNaa",
        "coins": 500,
        "price": 5.00
    },
    "popular_choice": {
        "name": "Popular Choice", 
        "price_id": "price_1RYSeQIhYvmNDX3MnCR8mjK7",
        "coins": 1200,
        "price": 10.00
    },
    "value_bundle": {
        "name": "Value Bundle", 
        "price_id": "price_1RYSeRIhYvmNDX3MXfZOP8vL",
        "coins": 2500,
        "price": 20.00
    },
    "premium_pack": {
        "name": "Premium Pack", 
        "price_id": "price_1RYSeSIhYvmNDX3MfkPQOZPU",
        "coins": 6500,
        "price": 50.00
    },
    "whale_package": {
        "name": "Whale Package", 
        "price_id": "price_1RYSeSIhYvmNDX3MattSagbe",
        "coins": 15000,
        "price": 100.00
    },
    # Premium packages
    "premium_monthly": {
        "name": "Premium Monthly", 
        "price_id": "price_1RYSeTIhYvmNDX3Mnrug6K6w",
        "type": "subscription",
        "price": 9.99
    },
    "premium_yearly": {
        "name": "Premium Yearly", 
        "price_id": "price_1RYSeTIhYvmNDX3MXvGNt1Yh",
        "type": "subscription",
        "price": 99.99
    }
}

def create_test_checkout_urls():
    """Maak test checkout URLs voor alle packages"""
    
    print("🚀 Creating Test Checkout URLs...\n")
    
    test_urls = []
    
    for package_id, package_info in packages.items():
        try:
            is_subscription = package_info.get("type") == "subscription"
            
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': package_info["price_id"],
                    'quantity': 1,
                }],
                mode='subscription' if is_subscription else 'payment',
                success_url=f"https://www.adultsplaystore.com/payment/success?session_id={{CHECKOUT_SESSION_ID}}&package={package_id}",
                cancel_url="https://www.adultsplaystore.com/game",
                metadata={
                    "package_id": package_id,
                    "user_id": "test_user",
                    "type": "subscription" if is_subscription else "coins"
                }
            )
            
            test_urls.append({
                "package_id": package_id,
                "name": package_info["name"],
                "price": f"€{package_info['price']}",
                "coins": package_info.get("coins"),
                "session_id": session.id,
                "url": session.url
            })
            
            print(f"✅ {package_info['name']}")
            print(f"   💰 {package_info.get('coins', 'Premium')} {'coins' if 'coins' in package_info else ''}")
            print(f"   💳 €{package_info['price']}")
            print(f"   🔗 {session.url}")
            print(f"   🆔 {session.id}")
            print()
            
        except Exception as e:
            print(f"❌ Error creating {package_id}: {e}")
    
    return test_urls

def test_api_call():
    """Test een simpele API call"""
    print("🧪 Testing Stripe API Connection...\n")
    
    try:
        # Test basic API call
        products = stripe.Product.list(limit=3)
        print(f"✅ API Connection successful")
        print(f"✅ Found {len(products.data)} products")
        for product in products.data:
            print(f"  - {product.name}")
        print()
        return True
    except Exception as e:
        print(f"❌ API Error: {e}")
        return False

if __name__ == "__main__":
    print("🎯 Lucky Flirty Chat - Quick Checkout Test\n")
    print("=" * 60)
    
    # Test API connection first
    if test_api_call():
        print("=" * 60)
        
        # Create checkout URLs
        urls = create_test_checkout_urls()
        
        print("=" * 60)
        print(f"✅ Successfully generated {len(urls)} checkout URLs")
        print("💳 Test Card: 4242424242424242")
        print("📧 Any email, any future expiry, any CVC")
        print("🌐 Copy URLs to browser to test payments")
        
        # Save to file for easy access
        with open("checkout_urls.txt", "w") as f:
            f.write("🔗 CHECKOUT TEST URLS\n")
            f.write("=" * 40 + "\n\n")
            for url_info in urls:
                f.write(f"{url_info['name']}\n")
                f.write(f"Price: {url_info['price']}\n")
                if url_info['coins']:
                    f.write(f"Coins: {url_info['coins']}\n")
                f.write(f"URL: {url_info['url']}\n")
                f.write(f"Session: {url_info['session_id']}\n")
                f.write("-" * 40 + "\n\n")
        
        print(f"📝 URLs also saved to: checkout_urls.txt")
    else:
        print("❌ Cannot proceed without API connection") 