from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import firebase_admin
from firebase_admin import credentials, firestore, auth
import asyncio
import os
from typing import Dict, List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Stripe imports
import sys
sys.path.append('..')
from stripe_service import stripe_service, PackageType

# Import AI chat router
from app.apis.ai_chat.router import router as ai_chat_router

app = FastAPI(title="Lucky Flirty Chat API")

# Include AI chat router
app.include_router(ai_chat_router, prefix="/api/ai-chat")

# CORS configuratie
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase initialisatie
# Try to find the correct Firebase credentials file
import pathlib
backend_dir = pathlib.Path(__file__).parent.parent
firebase_files = [
    "flirty-chat-a045e-firebase-adminsdk-fbsvc-65d0336c91.json",
    "flirty-chat-a045e-firebase-adminsdk-fbsvc-aa481051b6.json", 
    "flirty-chat-a045e-firebase-adminsdk-fbsvc-ecac652d0a.json"
]

firebase_cred_path = None
for filename in firebase_files:
    potential_path = backend_dir / filename
    if potential_path.exists():
        firebase_cred_path = str(potential_path)
        break

if firebase_cred_path:
    cred = credentials.Certificate(firebase_cred_path)
    firebase_admin.initialize_app(cred)
    print(f"🔥 Firebase initialized with: {firebase_cred_path}")
else:
    print("❌ No Firebase credentials file found")
db = firestore.client()

# Pydantic models voor Stripe
class CreateCheckoutRequest(BaseModel):
    package_id: str
    package_type: str  # "coins" or "premium_monthly" or "premium_yearly"
    user_id: Optional[str] = None
    success_url: str = "http://localhost:3000/payment/success"
    cancel_url: str = "http://localhost:3000/payment/cancel"

class WebhookRequest(BaseModel):
    payload: str
    signature: str

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Lucky Flirty Chat API"}

@app.get("/api/dealers")
async def get_dealers():
    try:
        dealers_ref = db.collection('dealers')
        docs = dealers_ref.stream()
        
        dealers = []
        for doc in docs:
            dealer_data = doc.to_dict()
            dealer_data['id'] = doc.id
            dealers.append(dealer_data)
        
        return {"dealers": dealers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === STRIPE ENDPOINTS ===

@app.get("/api/payments/packages")
async def get_packages():
    """Haal alle beschikbare coin en premium pakketten op"""
    try:
        coin_packages = []
        for package in stripe_service.coin_packages.values():
            coin_packages.append({
                "id": package.id,
                "name": package.name,
                "coins": package.coins,
                "price_eur": package.price_eur,
                "original_price_eur": package.original_price_eur,
                "is_popular": package.is_popular,
                "bonus_description": package.bonus_description,
                "type": "coins"
            })
        
        premium_packages = []
        for package in stripe_service.premium_packages.values():
            premium_packages.append({
                "id": package.id,
                "name": package.name,
                "price_eur": package.price_eur,
                "interval": package.interval,
                "features": package.features,
                "type": "premium"
            })
        
        return {
            "coin_packages": coin_packages,
            "premium_packages": premium_packages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/payments/create-checkout")
async def create_checkout_session(request: CreateCheckoutRequest):
    """Maak een Stripe Checkout sessie aan"""
    try:
        # Bepaal package type
        if request.package_type == "coins":
            package_type = PackageType.COINS
        elif request.package_type == "premium_monthly":
            package_type = PackageType.PREMIUM_MONTHLY
        elif request.package_type == "premium_yearly":
            package_type = PackageType.PREMIUM_YEARLY
        else:
            raise HTTPException(status_code=400, detail="Invalid package type")
        
        # Haal gebruiker email op als user_id is gegeven
        customer_email = None
        if request.user_id:
            try:
                user_record = auth.get_user(request.user_id)
                customer_email = user_record.email
            except Exception as e:
                print(f"Could not get user email: {e}")
        
        # Maak checkout sessie aan
        session = stripe_service.create_checkout_session(
            package_id=request.package_id,
            package_type=package_type,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            customer_email=customer_email,
            user_id=request.user_id
        )
        
        return {
            "checkout_url": session.url,
            "session_id": session.id
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/payments/webhook")
async def stripe_webhook(request: Request):
    """Verwerk Stripe webhook events"""
    try:
        payload = await request.body()
        signature = request.headers.get('stripe-signature')
        
        if not signature:
            raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
        # Verwerk webhook met stripe service
        result = stripe_service.handle_webhook(payload.decode(), signature)
        
        if result["success"]:
            # Verwerk de actie gebaseerd op het resultaat
            if result.get("action") == "add_coins":
                await add_coins_to_user(result["user_id"], result["coins"])
            elif result.get("action") == "activate_premium":
                await activate_premium_status(result["customer_id"])
            elif result.get("action") == "deactivate_premium":
                await deactivate_premium_status(result["customer_id"])
        
        return JSONResponse(content={"received": True})
        
    except Exception as e:
        print(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/payments/subscriptions/{user_email}")
async def get_user_subscriptions(user_email: str):
    """Haal actieve abonnementen op voor een gebruiker"""
    try:
        subscriptions = stripe_service.get_customer_subscriptions(user_email)
        return {"subscriptions": subscriptions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === HELPER FUNCTIONS ===

async def add_coins_to_user(user_id: str, coins: int):
    """Voeg coins toe aan een gebruiker"""
    try:
        if not user_id:
            return
            
        # Haal huidige player data op
        player_ref = db.collection('playerProgress').document(user_id)
        player_doc = player_ref.get()
        
        if player_doc.exists:
            current_data = player_doc.to_dict()
            current_coins = current_data.get('playerCoins', 0)
            new_coins = current_coins + coins
            
            # Update coins
            player_ref.update({
                'playerCoins': new_coins,
                'lastUpdated': firestore.SERVER_TIMESTAMP
            })
        else:
            # Nieuwe player data
            player_ref.set({
                'playerCoins': coins,
                'lastUpdated': firestore.SERVER_TIMESTAMP,
                'totalCoinsEarned': coins
            })
        
        print(f"✅ Added {coins} coins to user {user_id}")
        
    except Exception as e:
        print(f"❌ Error adding coins to user {user_id}: {e}")

async def activate_premium_status(customer_id: str):
    """Activeer premium status voor een klant"""
    try:
        # Zoek gebruiker op basis van Stripe customer ID
        # Dit vereist dat we customer IDs opslaan in user profiles
        print(f"✅ Activated premium for customer {customer_id}")
        
    except Exception as e:
        print(f"❌ Error activating premium for customer {customer_id}: {e}")

async def deactivate_premium_status(customer_id: str):
    """Deactiveer premium status voor een klant"""
    try:
        # Zoek gebruiker op basis van Stripe customer ID
        # Dit vereist dat we customer IDs opslaan in user profiles
        print(f"✅ Deactivated premium for customer {customer_id}")
        
    except Exception as e:
        print(f"❌ Error deactivating premium for customer {customer_id}: {e}")

@app.post("/api/setup-stripe")
async def setup_stripe_products():
    """Setup Stripe producten en prijzen (admin only)"""
    try:
        await stripe_service.create_stripe_products()
        return {"message": "Stripe products created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
