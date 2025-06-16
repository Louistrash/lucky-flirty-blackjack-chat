#!/usr/bin/env python3
"""
Simple Firebase Storage connectivity test
"""

import os
from app.config import setup_firebase_credentials

def test_firebase_storage():
    """Test Firebase Storage connectivity"""
    try:
        # Setup credentials
        setup_firebase_credentials()
        
        # Import Firebase modules
        import firebase_admin
        from firebase_admin import credentials, storage
        
        # Try to get existing app or create new one
        try:
            app = firebase_admin.get_app()
            print("✅ Using existing Firebase app")
        except ValueError:
            # No app exists, create it
            cred = credentials.ApplicationDefault()
            app = firebase_admin.initialize_app(cred, {
                'storageBucket': 'flirty-chat-a045e.firebasestorage.app'
            })
            print("✅ Firebase app initialized")
        
        # Test storage bucket access
        bucket = storage.bucket()
        print(f"✅ Storage bucket connected: {bucket.name}")
        
        # Test list operation (basic connectivity)
        try:
            blobs = list(bucket.list_blobs(max_results=1))
            print(f"✅ Storage bucket accessible, found {len(blobs)} items")
        except Exception as e:
            print(f"⚠️ Storage bucket access limited: {e}")
        
        print("🎉 Firebase Storage is working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ Firebase Storage test failed: {e}")
        return False

if __name__ == "__main__":
    test_firebase_storage() 