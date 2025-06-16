#!/usr/bin/env python3
"""
Test script voor backend Firebase configuratie
"""
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

# Import backend modules
try:
    from app.config import firebase_config
    print("✅ Backend config imported successfully")
except ImportError as e:
    print(f"❌ Failed to import backend config: {e}")
    sys.exit(1)

try:
    from app.apis.firebase_storage import init_firebase, firebase_initialized, firebase_bucket
    print("✅ Firebase Storage API imported successfully")
except ImportError as e:
    print(f"❌ Failed to import Firebase Storage API: {e}")
    sys.exit(1)

def test_backend_firebase():
    """Test backend Firebase configuration"""
    print("🔥 Backend Firebase Test")
    print("=" * 50)
    
    # Test Firebase config
    print("🔄 Testing Firebase config...")
    try:
        config = firebase_config.get_firebase_config()
        print(f"✅ Firebase config loaded: {config['project_id']}")
        print(f"🪣 Storage bucket: {config['storage_bucket']}")
    except Exception as e:
        print(f"❌ Firebase config failed: {e}")
        return False
    
    # Test Firebase initialization
    print("🔄 Testing Firebase initialization...")
    print(f"Firebase initialized: {firebase_initialized}")
    print(f"Firebase bucket: {firebase_bucket}")
    
    if firebase_initialized and firebase_bucket:
        print(f"✅ Firebase Storage working: {firebase_bucket.name}")
        return True
    else:
        print("❌ Firebase Storage not initialized")
        
        # Try manual initialization
        print("🔄 Attempting manual initialization...")
        result = init_firebase()
        print(f"Manual init result: {result}")
        
        return result

if __name__ == "__main__":
    success = test_backend_firebase()
    print("=" * 50)
    if success:
        print("✅ Backend Firebase test PASSED!")
    else:
        print("❌ Backend Firebase test FAILED!")
    sys.exit(0 if success else 1) 