#!/usr/bin/env python3
"""
Automatische conversie van base64 afbeeldingen naar Firebase Storage
Dit script gebruikt de backend API om afbeeldingen te converteren
"""
import json
import sys
import base64
import tempfile
import os
import requests
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

def is_base64_data_url(url):
    """Controleer of een URL een base64 data URL is"""
    return url and url.startswith('data:image/')

def convert_base64_via_api(base64_data, file_path):
    """Converteer base64 naar Firebase Storage via backend API"""
    try:
        # Extract base64 data
        if ',' in base64_data:
            header, base64_string = base64_data.split(',', 1)
            mime_type = header.split(';')[0].split(':')[1] if ':' in header else 'image/jpeg'
        else:
            base64_string = base64_data
            mime_type = 'image/jpeg'
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(image_data)
            temp_file_path = temp_file.name
        
        try:
            # Upload via backend API
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('image.jpg', f, mime_type)}
                data = {
                    'storage_path': file_path,
                    'metadata': json.dumps({
                        'converted_from': 'base64',
                        'original_mime_type': mime_type
                    })
                }
                
                response = requests.post(
                    'http://localhost:8001/api/firebase-storage/upload',
                    files=files,
                    data=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success') and result.get('storage_method') == 'firebase_storage':
                        return result.get('download_url')
                    else:
                        print(f"  ❌ API upload failed: {result.get('message', 'Unknown error')}")
                        return None
                else:
                    print(f"  ❌ API request failed: {response.status_code}")
                    return None
        
        finally:
            # Cleanup temp file
            os.unlink(temp_file_path)
            
    except Exception as e:
        print(f"  ❌ Conversie gefaald: {e}")
        return None

def convert_all_base64_images(db):
    """Converteer alle base64 afbeeldingen van dealers"""
    dealers_ref = db.collection('dealers')
    dealers = dealers_ref.stream()
    
    converted_count = 0
    total_conversions = 0
    
    for dealer_doc in dealers:
        dealer_data = dealer_doc.to_dict()
        dealer_id = dealer_doc.id
        updated = False
        
        print(f"\n🔍 Controleer dealer: {dealer_id}")
        
        # Check avatar URL
        if dealer_data.get('avatarUrl') and dealer_data['avatarUrl'].startswith('data:image/'):
            print(f"  📷 Avatar is base64, converteer...")
            
            storage_path = f"dealers/{dealer_id}/avatar.jpg"
            new_url = convert_base64_via_api(dealer_data['avatarUrl'], storage_path)
            
            if new_url:
                dealer_data['avatarUrl'] = new_url
                updated = True
                total_conversions += 1
                print(f"  ✅ Avatar geconverteerd naar: {new_url[:80]}...")
        
        # Check professional image URL
        if dealer_data.get('professionalImageUrl') and dealer_data['professionalImageUrl'].startswith('data:image/'):
            print(f"  📷 Professional image is base64, converteer...")
            
            storage_path = f"dealers/{dealer_id}/professional.jpg"
            new_url = convert_base64_via_api(dealer_data['professionalImageUrl'], storage_path)
            
            if new_url:
                dealer_data['professionalImageUrl'] = new_url
                updated = True
                total_conversions += 1
                print(f"  ✅ Professional image geconverteerd naar: {new_url[:80]}...")
        
        # Check outfit stages
        outfit_stages = dealer_data.get('outfitStages', [])
        for i, stage in enumerate(outfit_stages):
            if stage.get('imageUrl') and stage['imageUrl'].startswith('data:image/'):
                print(f"  📷 Outfit stage {i+1} is base64, converteer...")
                
                storage_path = f"dealers/{dealer_id}/outfits/stage_{i+1}.jpg"
                new_url = convert_base64_via_api(stage['imageUrl'], storage_path)
                
                if new_url:
                    outfit_stages[i]['imageUrl'] = new_url
                    updated = True
                    total_conversions += 1
                    print(f"  ✅ Stage {i+1} geconverteerd naar: {new_url[:80]}...")
        
        # Update dealer in Firestore als er wijzigingen zijn
        if updated:
            try:
                dealers_ref.document(dealer_id).set(dealer_data)
                converted_count += 1
                print(f"  💾 Dealer {dealer_id} bijgewerkt in Firestore")
            except Exception as e:
                print(f"  ❌ Fout bij Firestore update: {e}")
        else:
            print(f"  ℹ️ Geen base64 afbeeldingen gevonden")
    
    return converted_count, total_conversions

def check_backend_status():
    """Controleer of de backend API beschikbaar is"""
    try:
        response = requests.get('http://localhost:8001/api/firebase-storage/health', timeout=5)
        if response.status_code == 200:
            health = response.json()
            if health.get('firebase_initialized'):
                print("✅ Backend API is beschikbaar en Firebase Storage is geïnitialiseerd")
                return True
            else:
                print("❌ Backend API beschikbaar maar Firebase Storage is niet geïnitialiseerd")
                return False
        else:
            print("❌ Backend API is niet beschikbaar")
            return False
    except Exception as e:
        print(f"❌ Kan geen verbinding maken met backend API: {e}")
        return False

def main():
    """Main functie"""
    print("🔄 Automatische Base64 naar Firebase Storage Converter")
    print("=" * 60)
    
    # Check backend status
    if not check_backend_status():
        print("\n💡 Zorg ervoor dat de backend server draait:")
        print("   cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001")
        sys.exit(1)
    
    # Initialiseer Firebase
    db = init_firebase()
    if not db:
        sys.exit(1)
    
    # Converteer alle dealers
    print("\n🔄 Start automatische conversie van dealer afbeeldingen...")
    converted_dealers, total_images = convert_all_base64_images(db)
    
    print(f"\n✅ Automatische conversie voltooid!")
    print(f"📊 {converted_dealers} dealers bijgewerkt")
    print(f"🖼️ {total_images} afbeeldingen geconverteerd naar Firebase Storage")

if __name__ == "__main__":
    main() 