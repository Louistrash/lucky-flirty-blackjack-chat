#!/usr/bin/env python3
"""
Test script voor Firebase Storage connectiviteit
"""
import json
import os
import sys
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, storage
    print("✅ Firebase Admin SDK is beschikbaar")
except ImportError:
    print("❌ Firebase Admin SDK niet gevonden. Installeer met: pip install firebase-admin")
    sys.exit(1)

def test_firebase_storage():
    """Test Firebase Storage connectiviteit"""
    
    # Zoek service account bestand
    service_account_path = Path("backend/flirty-chat-a045e-firebase-adminsdk-fbsvc-ecac652d0a.json")
    
    if not service_account_path.exists():
        print(f"❌ Service account bestand niet gevonden: {service_account_path}")
        return False
    
    try:
        # Initialiseer Firebase Admin SDK
        print("🔄 Initialiseren Firebase Admin SDK...")
        
        # Laad service account
        with open(service_account_path, 'r') as f:
            service_account_info = json.load(f)
        
        # Initialiseer Firebase app
        cred = credentials.Certificate(service_account_info)
        
        # Check if app already exists
        try:
            app = firebase_admin.get_app()
            print("✅ Firebase app al geïnitialiseerd")
        except ValueError:
            app = firebase_admin.initialize_app(cred, {
                'storageBucket': 'flirty-chat-a045e.firebasestorage.app'
            })
            print("✅ Firebase app geïnitialiseerd")
        
        # Test Storage bucket
        print("🔄 Testen Firebase Storage bucket...")
        bucket = storage.bucket()
        print(f"✅ Storage bucket verbonden: {bucket.name}")
        
        # Test bucket toegang door metadata op te halen
        try:
            # Probeer bucket metadata op te halen
            bucket.reload()
            print("✅ Bucket metadata succesvol opgehaald")
            
            # Test lijst van bestanden (eerste 5)
            blobs = list(bucket.list_blobs(max_results=5))
            print(f"📁 Aantal bestanden in bucket: {len(blobs)}")
            
            if blobs:
                print("📄 Eerste bestanden:")
                for blob in blobs[:3]:
                    print(f"  - {blob.name} ({blob.size} bytes)")
            else:
                print("📄 Bucket is leeg (dit is normaal voor nieuwe buckets)")
            
            return True
            
        except Exception as access_error:
            print(f"❌ Bucket toegang gefaald: {access_error}")
            print("🔗 Controleer billing: https://console.firebase.google.com/project/flirty-chat-a045e/settings/usage")
            print("🔗 Controleer storage rules: https://console.firebase.google.com/project/flirty-chat-a045e/storage")
            return False
            
    except Exception as e:
        print(f"❌ Firebase Storage test gefaald: {e}")
        return False

def main():
    """Main test functie"""
    print("🔥 Firebase Storage Connectiviteit Test")
    print("=" * 50)
    
    success = test_firebase_storage()
    
    print("=" * 50)
    if success:
        print("✅ Firebase Storage test GESLAAGD!")
        print("🎉 Je Firebase Storage is correct geconfigureerd en toegankelijk.")
    else:
        print("❌ Firebase Storage test GEFAALD!")
        print("🔧 Controleer de bovenstaande foutmeldingen en links.")
        print("💡 Mogelijke oplossingen:")
        print("   1. Controleer of Firebase Blaze plan is geactiveerd")
        print("   2. Controleer Storage security rules")
        print("   3. Controleer service account permissies")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 