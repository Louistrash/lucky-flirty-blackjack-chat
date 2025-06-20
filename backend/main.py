import os
import pathlib
from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from stripe_service import StripeService, PackageType
import stripe
from pydantic import BaseModel
from typing import List, Optional

# Import Firebase configuration FIRST to set up credentials
try:
    from app.config import setup_firebase_credentials
    print("🔥 Firebase configuration loaded")
except ImportError as e:
    print(f"⚠️ Could not import Firebase config: {e}")

# AI Chat Models
class ChatMessageInput(BaseModel):
    role: str # "user" or "assistant"
    content: str

class AiChatRequest(BaseModel):
    message: str
    history: List[ChatMessageInput]
    outfit_stage_index: Optional[int] = None

class AiChatResponse(BaseModel):
    reply: str

# OpenAI Client
def get_openai_client():
    """Get OpenAI client with API key from environment"""
    try:
        from openai import OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key == "sk-your-openai-api-key-here":
            print("⚠️ OpenAI API key not configured properly")
            raise ValueError("OPENAI_API_KEY environment variable not set or using placeholder")
        return OpenAI(api_key=api_key)
    except ImportError:
        print("❌ OpenAI library not installed. Run: pip install openai")
        raise ValueError("OpenAI library not installed")

def import_api_routers() -> APIRouter:
    """Create top level router including all user defined endpoints."""
    routes = APIRouter(prefix="/api")

    src_path = pathlib.Path(__file__).parent
    apis_path = src_path / "app" / "apis"

    api_names = [
        p.relative_to(apis_path).parent.as_posix()
        for p in apis_path.glob("*/__init__.py")
    ]

    api_module_prefix = "app.apis."

    for name in api_names:
        print(f"Importing API: {name}")
        try:
            api_module = __import__(api_module_prefix + name, fromlist=[name])
            api_router = getattr(api_module, "router", None)
            if isinstance(api_router, APIRouter):
                routes.include_router(api_router)
        except Exception as e:
            print(e)
            continue

    return routes

def create_app() -> FastAPI:
    """Create the FastAPI application."""
    app = FastAPI(
        title="Lucky Flirty Chat API",
        description="Backend API for the Lucky Flirty Chat application",
        version="1.0.0"
    )
    
    # Set up CORS
    origins = [
        "https://www.adultsplaystore.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173", # Default Vite dev port
    ]

    # You can also read this from an environment variable for more flexibility
    # cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(',')
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins, 
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(import_api_routers())
    
    # Initialize Stripe service
    stripe_service = StripeService()

    @app.get("/")
    async def root():
        return {"message": "Welcome to Lucky Flirty Chat API"}
    
    @app.get("/health")
    async def health():
        return {"status": "healthy", "service": "lucky-flirty-chat-api"}

    # Stripe Payment Endpoints
    @app.post("/api/create-checkout-session")
    async def create_checkout_session(request: dict):
        """Maak een Stripe Checkout sessie aan"""
        try:
            # Valideer verplichte velden
            if not request.get('package_id') or not request.get('package_type'):
                raise HTTPException(status_code=400, detail="package_id and package_type are required")

            # Bepaal package type
            package_type_map = {
                'coins': PackageType.COINS,
                'premium_monthly': PackageType.PREMIUM_MONTHLY,
                'premium_yearly': PackageType.PREMIUM_YEARLY
            }
            
            package_type = package_type_map.get(request['package_type'])
            if not package_type:
                raise HTTPException(status_code=400, detail="Invalid package type")
            
            # Maak checkout sessie aan
            session = stripe_service.create_checkout_session(
                package_id=request['package_id'],
                package_type=package_type,
                success_url=request.get('success_url', 'https://www.adultsplaystore.com/payment/success?session_id={CHECKOUT_SESSION_ID}'),
                cancel_url=request.get('cancel_url', 'https://www.adultsplaystore.com/payment/cancel'),
                customer_email=request.get('customer_email'),
                user_id=request.get('user_id')
            )
            
            return {
                "success": True,
                "checkout_url": session.url,
                "session_id": session.id
            }
            
        except Exception as e:
            print(f"Error creating checkout session: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/api/webhooks/stripe")
    async def stripe_webhook(request: Request):
        """Handle Stripe webhook events"""
        try:
            payload = await request.body()
            sig_header = request.headers.get('stripe-signature')
            
            if not sig_header:
                raise HTTPException(400, "Missing stripe-signature header")
            
            result = stripe_service.handle_webhook(payload.decode(), sig_header)
            
            if not result.get('success'):
                raise HTTPException(400, result.get('error', 'Webhook processing failed'))
            
            # Here you would typically update your database
            # For example:
            # - Add coins to user account
            # - Activate premium subscription
            # - Update user status
            
            print(f"Webhook processed successfully: {result}")
            return {"status": "success", "result": result}
            
        except Exception as e:
            print(f"Webhook error: {e}")
            raise HTTPException(400, str(e))

    @app.get("/payment/success")
    async def payment_success(session_id: str):
        """Handle successful payment redirect"""
        try:
            # Retrieve session from Stripe to verify
            session = stripe.checkout.Session.retrieve(session_id)
            
            return {
                "success": True,
                "message": "Payment successful!",
                "session_id": session_id,
                "payment_status": session.payment_status
            }
        except Exception as e:
            print(f"Error verifying payment: {e}")
            return {"success": False, "error": str(e)}

    @app.get("/payment/cancel")
    async def payment_cancel():
        """Handle cancelled payment redirect"""
        return {
            "success": False,
            "message": "Payment was cancelled",
            "redirect_url": "https://www.adultsplaystore.com/game"
        }

    @app.get("/api/packages")
    async def get_packages():
        """Get all available coin and premium packages"""
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
                    "stripe_price_id": package.stripe_price_id
                })
            
            premium_packages = []
            for package in stripe_service.premium_packages.values():
                premium_packages.append({
                    "id": package.id,
                    "name": package.name,
                    "price_eur": package.price_eur,
                    "interval": package.interval,
                    "features": package.features,
                    "stripe_price_id": package.stripe_price_id
                })
            
            return {
                "success": True,
                "coin_packages": coin_packages,
                "premium_packages": premium_packages
            }
        except Exception as e:
            print(f"Error getting packages: {e}")
            raise HTTPException(500, str(e))

    @app.get("/api/test-stripe-config")
    async def test_stripe_config():
        """Test de Stripe configuratie"""
        try:
            # Test de API key door een simpele Stripe API call te maken
            account = stripe.Account.retrieve()
            return {
                "success": True,
                "message": "Stripe configuratie is correct",
                "account_id": account.id
            }
        except Exception as e:
            print(f"Stripe configuratie error: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Stripe configuratie error: {str(e)}"
            )

    # AI Chat Endpoints
    @app.post("/api/ai-chat/send-message", response_model=AiChatResponse)
    async def send_chat_message(request: AiChatRequest):
        """Send a chat message to AI and get response"""
        try:
            client = get_openai_client()
            
            # Build messages for OpenAI
            messages = []
            for msg in request.history:
                messages.append({"role": msg.role, "content": msg.content})
            
            # Add current message
            messages.append({"role": "user", "content": request.message})
            
            # Personality prompts based on outfit stage - ALL IN ENGLISH as default
            personality_prompts = [
                "I am a professional blackjack dealer with natural charm. I am warm, professional and subtly playful. I use gentle flirtation and encouragement. Keep responses under 15 words.",
                "I am an elegant blackjack dealer in cocktail attire. I am charming, witty and more intimate. I compliment your decisions and create romantic tension. Keep responses under 15 words.",
                "I am a casual but stylish blackjack dealer. I am approachable, fun and flirtatiously encouraging. I playfully tease about your luck and skills. Keep responses under 15 words.",
                "I am a sporty, confident blackjack dealer. I am energetic, bold and confidently flirtatious. I celebrate your wins with enthusiasm. Keep responses under 15 words.",
                "I am a beautiful blackjack dealer in swimwear. I am confident, seductive and playfully enticing. I use sensual compliments. Keep responses under 15 words.",
                "I am a luxurious, captivating blackjack dealer. I am refined, mysterious and irresistibly charming. I whisper sweet encouragements. Keep responses under 15 words."
            ]
            
            outfit_stage = request.outfit_stage_index or 0
            if outfit_stage >= len(personality_prompts):
                outfit_stage = 0
                
            system_prompt = personality_prompts[outfit_stage]
            
            # Detect language from recent messages and respond accordingly
            # Default to English, but detect if user speaks Dutch, German, etc.
            language_instruction = " IMPORTANT: Default to English responses. If you detect the user is speaking Dutch, respond in Dutch. If German, respond in German. If unclear or mixed languages, use English."
            
            # Add system prompt
            messages.insert(0, {"role": "system", "content": system_prompt + language_instruction})
            
            # Get AI response
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=50,
                temperature=0.7
            )
            
            reply = response.choices[0].message.content
            return AiChatResponse(reply=reply)
            
        except ValueError as e:
            # Return helpful message when OpenAI is not configured
            return AiChatResponse(
                reply="AI chat is not configured. Please add OPENAI_API_KEY to your environment variables."
            )
        except Exception as e:
            print(f"AI Chat error: {e}")
            return AiChatResponse(
                reply="An error occurred while processing your message. Please try again."
            )

    # Lokalisatie endpoints
    @app.get("/api/translations/{language}")
    async def get_translations(language: str):
        """Get translations for specified language"""
        translations = {
            "en": {
                "general": {
                    "play": "PLAY",
                    "professional": "Professional", 
                    "experience": "Experience",
                    "expert": "Expert"
                },
                "home": {
                    "professionalText": "Professional",
                    "experienceText": "Experience"
                }
            },
            "nl": {
                "general": {
                    "play": "SPELEN",
                    "professional": "Professioneel",
                    "experience": "Ervaring", 
                    "expert": "Expert"
                },
                "home": {
                    "professionalText": "Professioneel",
                    "experienceText": "Ervaring"
                }
            }
        }
        
        return translations.get(language, translations["en"])

    @app.get("/api/test")
    async def test_endpoint():
        """Test endpoint to verify API is working"""
        return {
            "message": "API test successful",
            "endpoints": [
                "/",
                "/health", 
                "/api/create-checkout-session",
                "/api/ai-chat/send-message",
                "/api/translations/{language}"
            ]
        }

    return app

app = create_app()
