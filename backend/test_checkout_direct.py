#!/usr/bin/env python3
"""
Direct test script om checkout URLs te testen
"""
import requests
import json
from stripe_service import StripeService, PackageType

def test_api_endpoints():
    """Test de API endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing API Endpoints...\n")
    
    # Test 1: Get packages
    try:
        print("1️⃣ Testing GET /api/packages")
        response = requests.get(f"{base_url}/api/packages")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data['coin_packages'])} coin packages")
            print(f"✅ Found {len(data['premium_packages'])} premium packages")
        else:
            print(f"❌ Error: {response.text}")
        print()
    except Exception as e:
        print(f"❌ Connection error: {e}\n")
    
    # Test 2: Create checkout session for Popular Choice
    try:
        print("2️⃣ Testing POST /api/create-checkout-session (Popular Choice)")
        payload = {
            "package_id": "popular_choice",
            "package_type": "coins",
            "user_id": "test_user_123",
            "customer_email": "test@example.com"
        }
        
        response = requests.post(
            f"{base_url}/api/create-checkout-session",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Checkout URL: {data['url']}")
            print(f"✅ Session ID: {data['id']}")
        else:
            print(f"❌ Error: {response.text}")
        print()
    except Exception as e:
        print(f"❌ Error: {e}\n")
    
    # Test 3: Create checkout session for Premium Monthly
    try:
        print("3️⃣ Testing POST /api/create-checkout-session (Premium Monthly)")
        payload = {
            "package_id": "premium_monthly",
            "package_type": "premium_monthly",
            "user_id": "test_user_123",
            "customer_email": "test@example.com"
        }
        
        response = requests.post(
            f"{base_url}/api/create-checkout-session",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Checkout URL: {data['url']}")
            print(f"✅ Session ID: {data['id']}")
        else:
            print(f"❌ Error: {response.text}")
        print()
    except Exception as e:
        print(f"❌ Error: {e}\n")

def test_direct_stripe_service():
    """Test direct Stripe service functionaliteit"""
    print("🔧 Testing Direct Stripe Service...\n")
    
    try:
        service = StripeService()
        
        # Test 1: Create checkout session voor starter pack
        print("1️⃣ Creating checkout session for Starter Pack")
        session = service.create_checkout_session(
            package_id="starter_pack",
            package_type=PackageType.COINS,
            success_url="https://example.com/success",
            cancel_url="https://example.com/cancel",
            user_id="test_user_direct"
        )
        
        print(f"✅ Session ID: {session.id}")
        print(f"✅ URL: {session.url}")
        print(f"✅ Status: {session.status}")
        print()
        
        # Test 2: List alle coin packages
        print("2️⃣ Listing coin packages")
        for pkg_id, pkg in service.coin_packages.items():
            print(f"  {pkg.name}: {pkg.coins} coins voor €{pkg.price_eur}")
        print()
        
        # Test 3: List premium packages
        print("3️⃣ Listing premium packages")
        for pkg_id, pkg in service.premium_packages.items():
            print(f"  {pkg.name}: €{pkg.price_eur}/{pkg.interval}")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}\n")

def generate_test_urls():
    """Generate test URLs voor alle packages"""
    print("🔗 Generating Test URLs...\n")
    
    try:
        service = StripeService()
        
        test_urls = []
        
        # Coin packages
        for pkg_id, pkg in service.coin_packages.items():
            session = service.create_checkout_session(
                package_id=pkg_id,
                package_type=PackageType.COINS,
                success_url="https://www.adultsplaystore.com/payment/success",
                cancel_url="https://www.adultsplaystore.com/payment/cancel",
                user_id="test_user"
            )
            
            test_urls.append({
                "package": pkg.name,
                "type": "coins",
                "price": f"€{pkg.price_eur}",
                "coins": pkg.coins,
                "url": session.url,
                "session_id": session.id
            })
        
        # Premium packages
        for pkg_id, pkg in service.premium_packages.items():
            package_type = PackageType.PREMIUM_MONTHLY if pkg.interval == "month" else PackageType.PREMIUM_YEARLY
            
            session = service.create_checkout_session(
                package_id=pkg_id,
                package_type=package_type,
                success_url="https://www.adultsplaystore.com/payment/success",
                cancel_url="https://www.adultsplaystore.com/payment/cancel",
                user_id="test_user"
            )
            
            test_urls.append({
                "package": pkg.name,
                "type": "premium",
                "price": f"€{pkg.price_eur}/{pkg.interval}",
                "coins": None,
                "url": session.url,
                "session_id": session.id
            })
        
        # Output results
        print("📋 TEST CHECKOUT URLS:\n")
        for item in test_urls:
            print(f"🎯 {item['package']}")
            if item['coins']:
                print(f"   💰 {item['coins']} coins voor {item['price']}")
            else:
                print(f"   👑 Premium subscription {item['price']}")
            print(f"   🔗 {item['url']}")
            print(f"   🆔 {item['session_id']}")
            print()
        
        return test_urls
        
    except Exception as e:
        print(f"❌ Error generating URLs: {e}")
        return []

if __name__ == "__main__":
    print("🚀 Lucky Flirty Chat - Stripe Payment Testing\n")
    print("=" * 60)
    
    # Test API endpoints
    test_api_endpoints()
    
    print("=" * 60)
    
    # Test direct Stripe service
    test_direct_stripe_service()
    
    print("=" * 60)
    
    # Generate test URLs
    urls = generate_test_urls()
    
    print("=" * 60)
    print(f"✅ Generated {len(urls)} test checkout URLs")
    print("💳 Use test card: 4242424242424242")
    print("📧 Any email, any future date, any CVC")
    print("🌐 Open URLs in browser to test checkout flow") 