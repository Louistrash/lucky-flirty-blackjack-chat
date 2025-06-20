from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import asyncio
import os

# Firebase imports
try:
    from firebase_admin import firestore
    import firebase_admin
    
    # Initialize Firestore if not already done
    if not firebase_admin._apps:
        from app.config import setup_firebase_credentials
        setup_firebase_credentials()
    
    db = firestore.client()
    FIRESTORE_AVAILABLE = True
    print("🔥 Firestore client initialized for dealers API")
except Exception as e:
    FIRESTORE_AVAILABLE = False
    print(f"⚠️ Firestore not available for dealers API: {e}")
    db = None

router = APIRouter(prefix="/dealers", tags=["dealers"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_dealers():
    """
    Haalt alle dealers op uit Firestore
    """
    try:
        if not FIRESTORE_AVAILABLE or not db:
            raise HTTPException(
                status_code=503, 
                detail="Firestore service not available"
            )
        
        # Haal alle dealers op uit de dealers collectie
        dealers_ref = db.collection('dealers')
        docs = dealers_ref.stream()
        
        dealers = []
        for doc in docs:
            dealer_data = doc.to_dict()
            dealer_data['id'] = doc.id
            dealers.append(dealer_data)
        
        print(f"📊 Found {len(dealers)} dealers in Firestore")
        return dealers
        
    except Exception as e:
        print(f"❌ Error fetching dealers: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dealers: {str(e)}"
        )

@router.get("/{dealer_id}", response_model=Dict[str, Any])
async def get_dealer(dealer_id: str):
    """
    Haalt een specifieke dealer op uit Firestore
    """
    try:
        if not FIRESTORE_AVAILABLE or not db:
            raise HTTPException(
                status_code=503, 
                detail="Firestore service not available"
            )
        
        # Haal specifieke dealer op
        dealer_ref = db.collection('dealers').document(dealer_id)
        doc = dealer_ref.get()
        
        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Dealer with id '{dealer_id}' not found"
            )
        
        dealer_data = doc.to_dict()
        dealer_data['id'] = doc.id
        
        print(f"📊 Found dealer: {dealer_id}")
        return dealer_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching dealer {dealer_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dealer: {str(e)}"
        )

@router.get("/health")
async def dealers_health():
    """
    Health check voor dealers API
    """
    return {
        "status": "healthy",
        "service": "dealers-api",
        "firestore_available": FIRESTORE_AVAILABLE
    } 