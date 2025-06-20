#!/usr/bin/env python3
"""
Firebase Storage Status Report
Geeft een overzicht van de Firebase configuratie en afbeelding storage status
"""
import sys
import requests
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, firestore, storage
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

def check_backend_api():
    """Check backend API status"""
    print("🔧 Backend API Status")
    print("-" * 30)
    
    try:
        response = requests.get('http://localhost:8001/api/firebase-storage/health', timeout=5)
        if response.status_code == 200:
            health = response.json()
            print("✅ Backend API: Online")
            print(f"   Firebase Initialized: {'✅' if health.get('firebase_initialized') else '❌'}")
            print(f"   Storage Bucket: {health.get('bucket_name', 'Unknown')}")
            print(f"   Storage Method: {health.get('storage_method', 'Unknown')}")
            return True
        else:
            print(f"❌ Backend API: Error ({response.status_code})")
            return False
    except Exception as e:
        print(f"❌ Backend API: Offline ({e})")
        return False

def check_firebase_direct():
    """Check direct Firebase connection"""
    print("\n🔥 Direct Firebase Status")
    print("-" * 30)
    
    if not FIREBASE_AVAILABLE:
        print("❌ Firebase Admin SDK not available")
        return False
    
    service_account_path = Path("backend/flirty-chat-a045e-firebase-adminsdk-fbsvc-ecac652d0a.json")
    
    if not service_account_path.exists():
        print(f"❌ Service account not found: {service_account_path}")
        return False
    
    try:
        # Initialize Firebase
        cred = credentials.Certificate(str(service_account_path))
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred, {
                'storageBucket': 'flirty-chat-a045e.firebasestorage.app'
            })
        
        # Test Firestore connection
        db = firestore.client()
        dealers_ref = db.collection('dealers')
        count = len(list(dealers_ref.limit(1).stream()))
        print("✅ Firestore: Connected")
        
        # Test Storage connection
        bucket = storage.bucket()
        print(f"✅ Storage Bucket: {bucket.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Firebase Connection: Failed ({e})")
        return False

def analyze_image_storage():
    """Analyze current image storage methods"""
    print("\n📊 Image Storage Analysis")
    print("-" * 30)
    
    if not FIREBASE_AVAILABLE:
        print("❌ Cannot analyze - Firebase SDK not available")
        return
    
    try:
        db = firestore.client()
        dealers_ref = db.collection('dealers')
        dealers = dealers_ref.stream()
        
        stats = {
            'total_dealers': 0,
            'dealers_with_images': 0,
            'firebase_storage_images': 0,
            'base64_images': 0,
            'external_images': 0,
            'missing_images': 0
        }
        
        for dealer_doc in dealers:
            dealer_data = dealer_doc.to_dict()
            stats['total_dealers'] += 1
            
            has_images = False
            
            # Check avatar
            avatar_url = dealer_data.get('avatarUrl', '')
            if avatar_url:
                has_images = True
                if avatar_url.startswith('https://firebasestorage.googleapis.com'):
                    stats['firebase_storage_images'] += 1
                elif avatar_url.startswith('data:image/'):
                    stats['base64_images'] += 1
                elif avatar_url.startswith('https://'):
                    stats['external_images'] += 1
            
            # Check outfit stages
            outfit_stages = dealer_data.get('outfitStages', [])
            for stage in outfit_stages:
                stage_url = stage.get('imageUrl', '')
                if stage_url:
                    has_images = True
                    if stage_url.startswith('https://firebasestorage.googleapis.com'):
                        stats['firebase_storage_images'] += 1
                    elif stage_url.startswith('data:image/'):
                        stats['base64_images'] += 1
                    elif stage_url.startswith('https://'):
                        stats['external_images'] += 1
            
            if has_images:
                stats['dealers_with_images'] += 1
            else:
                stats['missing_images'] += 1
        
        # Display results
        print(f"👥 Total Dealers: {stats['total_dealers']}")
        print(f"🖼️ Dealers with Images: {stats['dealers_with_images']}")
        print(f"🔥 Firebase Storage Images: {stats['firebase_storage_images']}")
        print(f"💾 Base64 Images: {stats['base64_images']}")
        print(f"🌐 External Images: {stats['external_images']}")
        print(f"❌ Missing Images: {stats['missing_images']}")
        
        # Recommendations
        print(f"\n💡 Recommendations:")
        if stats['base64_images'] > 0:
            print(f"   • Convert {stats['base64_images']} base64 images to Firebase Storage")
        if stats['firebase_storage_images'] > 0:
            print(f"   • ✅ {stats['firebase_storage_images']} images already using Firebase Storage")
        if stats['missing_images'] > 0:
            print(f"   • Upload images for {stats['missing_images']} dealers")
            
    except Exception as e:
        print(f"❌ Analysis failed: {e}")

def check_frontend_config():
    """Check frontend Firebase configuration"""
    print(f"\n🌐 Frontend Configuration")
    print("-" * 30)
    
    firebase_config_path = Path("frontend/src/app/auth/firebase.ts")
    if firebase_config_path.exists():
        print("✅ Firebase config file found")
        # Could parse and validate config here
    else:
        print("❌ Firebase config file not found")

def print_troubleshooting_guide():
    """Print troubleshooting tips"""
    print(f"\n🔧 Troubleshooting Guide")
    print("=" * 50)
    print("📱 If you see base64 URLs in dealer detail pages:")
    print("   1. Use the '🔄 Convert' button next to base64 images")
    print("   2. Or run: python auto_convert_base64.py")
    print("")
    print("🔥 If Firebase Storage is not working:")
    print("   1. Ensure backend server is running on port 8001")
    print("   2. Check Firebase project has Blaze plan enabled")
    print("   3. Verify service account permissions")
    print("")
    print("💾 For new uploads:")
    print("   1. Backend will try Firebase Storage first")
    print("   2. Falls back to optimized base64 if needed")
    print("   3. Convert base64 to Firebase Storage later")

def main():
    """Main function"""
    print("🔥 Firebase Storage Status Report")
    print("=" * 50)
    
    # Check all components
    backend_ok = check_backend_api()
    firebase_ok = check_firebase_direct()
    
    if firebase_ok:
        analyze_image_storage()
    
    check_frontend_config()
    
    print_troubleshooting_guide()
    
    # Overall status
    print(f"\n📋 Overall Status")
    print("-" * 20)
    if backend_ok and firebase_ok:
        print("✅ System is fully operational")
        print("   New uploads will use Firebase Storage")
        print("   Existing base64 images can be converted")
    elif firebase_ok:
        print("⚠️ Firebase works but backend API issues")
        print("   Manual conversion may be needed")
    else:
        print("❌ Firebase issues detected")
        print("   Check configuration and service account")

if __name__ == "__main__":
    main() 