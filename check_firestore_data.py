#!/usr/bin/env python3
"""
Script om Firestore data te controleren
"""
import json
import sys
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    print("✅ Firebase Admin SDK beschikbaar")
except ImportError:
    print("❌ Firebase Admin SDK niet gevonden. Installeer met: pip install firebase-admin")
    sys.exit(1)

def init_firebase():
    """Initialiseer Firebase Admin SDK"""
    service_account_path = Path("backend/flirty-chat-a045e-firebase-adminsdk-fbsvc-ecac652d0a.json")
    
    if not service_account_path.exists():
        print(f"❌ Service account bestand niet gevonden: {service_account_path}")
        return None
    
    try:
        # Initialiseer Firebase Admin
        cred = credentials.Certificate(str(service_account_path))
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        print("✅ Firebase geïnitialiseerd")
        return db
    except Exception as e:
        print(f"❌ Fout bij Firebase initialisatie: {e}")
        return None

def check_dealers(db):
    """Controleer alle dealers in Firestore"""
    dealers_ref = db.collection('dealers')
    dealers = dealers_ref.stream()
    
    count = 0
    for dealer_doc in dealers:
        dealer_data = dealer_doc.to_dict()
        dealer_id = dealer_doc.id
        count += 1
        
        print(f"\n🔍 Dealer: {dealer_id}")
        print(f"  📝 Name: {dealer_data.get('name', 'N/A')}")
        
        # Check avatarUrl
        avatar_url = dealer_data.get('avatarUrl', '')
        if avatar_url:
            if avatar_url.startswith('data:image/'):
                print(f"  📷 Avatar: Base64 data ({len(avatar_url)} chars)")
            else:
                print(f"  📷 Avatar: URL - {avatar_url[:80]}...")
        else:
            print(f"  📷 Avatar: Geen avatar")
        
        # Check professionalImageUrl
        prof_url = dealer_data.get('professionalImageUrl', '')
        if prof_url:
            if prof_url.startswith('data:image/'):
                print(f"  💼 Professional: Base64 data ({len(prof_url)} chars)")
            else:
                print(f"  💼 Professional: URL - {prof_url[:80]}...")
        else:
            print(f"  💼 Professional: Geen professional image")
        
        # Check outfit stages
        outfit_stages = dealer_data.get('outfitStages', [])
        print(f"  👗 Outfit stages: {len(outfit_stages)}")
        
        for i, stage in enumerate(outfit_stages):
            stage_name = stage.get('stageName', f'Stage {i+1}')
            image_url = stage.get('imageUrl', '')
            
            if image_url:
                if image_url.startswith('data:image/'):
                    print(f"    - {stage_name}: Base64 data ({len(image_url)} chars)")
                else:
                    print(f"    - {stage_name}: URL - {image_url[:80]}...")
            else:
                print(f"    - {stage_name}: Geen afbeelding")
    
    if count == 0:
        print("❌ Geen dealers gevonden in Firestore")
    else:
        print(f"\n📊 Totaal aantal dealers: {count}")

def main():
    """Main functie"""
    print("🔍 Firestore Data Checker")
    print("=" * 50)
    
    # Initialiseer Firebase
    db = init_firebase()
    if not db:
        sys.exit(1)
    
    # Controleer dealers
    check_dealers(db)

if __name__ == "__main__":
    main() 