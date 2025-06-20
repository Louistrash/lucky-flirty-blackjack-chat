"""
Firebase configuratie voor de backend server.
"""
import os
from typing import Dict, Optional

# Firebase configuratie uit de frontend
FIREBASE_CONFIG = {
    "apiKey": "AIzaSyBrENmWwomte9B3p3emXZcNN6S1KbMw-yk",
    "authDomain": "flirty-chat-a045e.firebaseapp.com",
    "projectId": "flirty-chat-a045e",
    "storageBucket": "flirty-chat-a045e.firebasestorage.app",
    "messagingSenderId": "177376218865",
    "appId": "1:177376218865:web:2fc736cfc207b307cce350",
    "databaseURL": "https://flirty-chat-a045e-default-rtdb.europe-west1.firebasedatabase.app",
    "measurementId": "G-M7K4JFS3EW"
}

def get_firebase_config() -> Dict[str, str]:
    """
    Haal Firebase configuratie op.
    
    Returns:
        Dict met Firebase configuratie
    """
    return {
        'project_id': FIREBASE_CONFIG['projectId'],
        'storage_bucket': FIREBASE_CONFIG['storageBucket'], 
        'auth_domain': FIREBASE_CONFIG['authDomain'],
        'api_key': FIREBASE_CONFIG['apiKey'],
        'database_url': FIREBASE_CONFIG['databaseURL'],
        'app_id': FIREBASE_CONFIG['appId'],
        'messaging_sender_id': FIREBASE_CONFIG['messagingSenderId']
    }

def get_storage_bucket_name() -> str:
    """
    Haal de storage bucket naam op.
    
    Returns:
        Bucket naam (bijv. 'flirty-chat-a045e.firebasestorage.app')
    """
    return FIREBASE_CONFIG['storageBucket']

def get_project_id() -> str:
    """
    Haal het Firebase project ID op.
    
    Returns:
        Project ID (bijv. 'flirty-chat-a045e')
    """
    return FIREBASE_CONFIG['projectId']

def is_firebase_configured() -> bool:
    """
    Controleer of Firebase correct is geconfigureerd.
    
    Returns:
        True als alle benodigde configuratie aanwezig is
    """
    required_fields = ['projectId', 'storageBucket', 'apiKey']
    return all(FIREBASE_CONFIG.get(field) for field in required_fields) 