#!/usr/bin/env python3
"""
Script om base64 afbeeldingen in Firestore te converteren naar Firebase Storage URLs
"""
import json
import os
import sys
import base64
import tempfile
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, firestore, storage
    print("✅ Firebase Admin SDK beschikbaar")
except ImportError:
    print("❌ Firebase Admin SDK niet gevonden. Installeer met: pip install firebase-admin")
    sys.exit(1)

def init_firebase():
    """Initialiseer Firebase Admin SDK"""
    service_account_path = Path("backend/flirty-chat-a045e-firebase-adminsdk-fbsvc-ecac652d0a.json")
    
    if not service_account_path.exists():
        print(f"❌ Service account bestand niet gevonden: {service_account_path}")
        return None, None
    
    try:
        # Initialiseer Firebase Admin
        cred = credentials.Certificate(str(service_account_path))
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred, {
                'storageBucket': 'flirty-chat-a045e.firebasestorage.app'
            })
        
        db = firestore.client()
        bucket = storage.bucket()
        
        print("✅ Firebase geïnitialiseerd")
        return db, bucket
    except Exception as e:
        print(f"❌ Fout bij Firebase initialisatie: {e}")
        return None, None

def is_base64_data_url(url):
    """Controleer of een URL een base64 data URL is"""
    return url and url.startswith('data:image/')

def convert_base64_to_file(base64_data, filename):
    """Converteer base64 data naar een tijdelijk bestand"""
    try:
        # Extract base64 data zonder data:image/jpeg;base64, prefix
        if ',' in base64_data:
            base64_string = base64_data.split(',')[1]
        else:
            base64_string = base64_data
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Maak tijdelijk bestand
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f'_{filename}.jpg')
        temp_file.write(image_data)
        temp_file.close()
        
        return temp_file.name
    except Exception as e:
        print(f"❌ Fout bij base64 conversie: {e}")
        return None

def upload_to_storage(bucket, file_path, storage_path):
    """Upload bestand naar Firebase Storage"""
    try:
        blob = bucket.blob(storage_path)
        
        with open(file_path, 'rb') as file_data:
            blob.upload_from_file(file_data, content_type='image/jpeg')
        
        # Maak URL publiek toegankelijk
        blob.make_public()
        
        download_url = blob.public_url
        print(f"✅ Geüpload naar Storage: {storage_path}")
        return download_url
    except Exception as e:
        print(f"❌ Upload naar Storage gefaald: {e}")
        return None

def convert_dealer_images(db, bucket):
    """Converteer alle base64 afbeeldingen van dealers naar Storage URLs"""
    dealers_ref = db.collection('dealers')
    dealers = dealers_ref.stream()
    
    converted_count = 0
    
    for dealer_doc in dealers:
        dealer_data = dealer_doc.to_dict()
        dealer_id = dealer_doc.id
        updated = False
        
        print(f"\n🔍 Controleer dealer: {dealer_id}")
        
        # Check avatar URL
        if dealer_data.get('avatarUrl') and is_base64_data_url(dealer_data['avatarUrl']):
            print(f"  📷 Avatar is base64, converteer...")
            
            temp_file = convert_base64_to_file(dealer_data['avatarUrl'], f"{dealer_id}_avatar")
            if temp_file:
                storage_path = f"dealers/{dealer_id}/avatar.jpg"
                new_url = upload_to_storage(bucket, temp_file, storage_path)
                
                if new_url:
                    dealer_data['avatarUrl'] = new_url
                    updated = True
                    print(f"  ✅ Avatar geconverteerd naar: {new_url[:80]}...")
                
                # Cleanup
                os.unlink(temp_file)
        
        # Check professional image URL
        if dealer_data.get('professionalImageUrl') and is_base64_data_url(dealer_data['professionalImageUrl']):
            print(f"  📷 Professional image is base64, converteer...")
            
            temp_file = convert_base64_to_file(dealer_data['professionalImageUrl'], f"{dealer_id}_professional")
            if temp_file:
                storage_path = f"dealers/{dealer_id}/professional.jpg"
                new_url = upload_to_storage(bucket, temp_file, storage_path)
                
                if new_url:
                    dealer_data['professionalImageUrl'] = new_url
                    updated = True
                    print(f"  ✅ Professional image geconverteerd naar: {new_url[:80]}...")
                
                # Cleanup
                os.unlink(temp_file)
        
        # Check outfit stages
        outfit_stages = dealer_data.get('outfitStages', [])
        for i, stage in enumerate(outfit_stages):
            if stage.get('imageUrl') and is_base64_data_url(stage['imageUrl']):
                print(f"  📷 Outfit stage {i+1} is base64, converteer...")
                
                temp_file = convert_base64_to_file(stage['imageUrl'], f"{dealer_id}_stage_{i+1}")
                if temp_file:
                    storage_path = f"dealers/{dealer_id}/outfits/stage_{i+1}.jpg"
                    new_url = upload_to_storage(bucket, temp_file, storage_path)
                    
                    if new_url:
                        outfit_stages[i]['imageUrl'] = new_url
                        updated = True
                        print(f"  ✅ Stage {i+1} geconverteerd naar: {new_url[:80]}...")
                    
                    # Cleanup
                    os.unlink(temp_file)
        
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
    
    return converted_count

def main():
    """Main functie"""
    print("🔥 Base64 naar Firebase Storage Converter")
    print("=" * 50)
    
    # Initialiseer Firebase
    db, bucket = init_firebase()
    if not db or not bucket:
        sys.exit(1)
    
    # Test bucket connectie
    try:
        bucket.get_blob('test')  # Dit kan een 404 geven, dat is oké
        print(f"✅ Bucket connectie succesvol: {bucket.name}")
    except Exception:
        pass  # 404 is oké, betekent bucket werkt
    
    # Converteer alle dealers
    print("\n🔄 Start conversie van dealer afbeeldingen...")
    converted_count = convert_dealer_images(db, bucket)
    
    print(f"\n✅ Conversie voltooid!")
    print(f"📊 {converted_count} dealers bijgewerkt")

if __name__ == "__main__":
    main() 