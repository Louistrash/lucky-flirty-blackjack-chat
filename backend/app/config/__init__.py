"""
Configuration module voor de backend applicatie.
""" 

import os
from pathlib import Path
import firebase_admin
from firebase_admin import credentials

def setup_firebase_credentials():
    """Setup Firebase credentials path"""
    # Zoek naar het Firebase service account bestand
    current_dir = Path(__file__).parent.parent.parent
    
    # Zoek eerst naar het nieuwe bestand in backend directory
    new_service_account_path = current_dir / "flirty-chat-a045e-firebase-adminsdk-fbsvc-aa481051b6.json"
    if new_service_account_path.exists():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(new_service_account_path)
        print(f"🔑 Firebase service account (NEW) found: {new_service_account_path}")
        return True
    
    # Zoek naar het nieuwe bestand in de root directory
    root_path = current_dir.parent / "flirty-chat-a045e-firebase-adminsdk-fbsvc-aa481051b6.json"
    if root_path.exists():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(root_path)
        print(f"🔑 Firebase service account found at root: {root_path}")
        return True
    
    # Fallback naar het oude bestand in backend directory
    old_service_account_path = current_dir / "flirty-chat-a045e-firebase-adminsdk-fbsvc-ecac652d0a.json"
    if old_service_account_path.exists():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(old_service_account_path)
        print(f"🔑 Firebase service account (OLD) path set: {old_service_account_path}")
        return True
    
    print("❌ No Firebase service account file found")
    print(f"Searched locations:")
    print(f"  - {new_service_account_path}")
    print(f"  - {root_path}")
    print(f"  - {old_service_account_path}")
    return False

# Setup credentials and initialize Firebase immediately when module is imported
if setup_firebase_credentials():
    try:
        firebase_admin.initialize_app()
        print("🔥 Firebase SDK initialized successfully")
    except Exception as e:
        print(f"⚠️ Failed to initialize Firebase SDK: {e}")