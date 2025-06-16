import stripe
import os
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Stripe configuratie met fallback
stripe_api_key = os.getenv('STRIPE_SECRET_KEY')
if not stripe_api_key:
    print("⚠️ STRIPE_SECRET_KEY not found in environment variables")
    if os.getenv('ENVIRONMENT') == 'development':
        print("💡 Using test key for development - add your real Stripe secret key to .env file for production")
        # Use a placeholder test key for development
        stripe_api_key = "sk_test_placeholder_key"
    else:
        # In production, we should fail fast if the key is not set.
        raise EnvironmentError("❌ STRIPE_SECRET_KEY is missing in production environment. Please set it in your .env file.")

stripe.api_key = stripe_api_key

class PackageType(Enum):
    COINS = "coins"
    PREMIUM_MONTHLY = "premium_monthly"
    PREMIUM_YEARLY = "premium_yearly"

@dataclass
class CoinPackage:
    id: str
    name: str
    coins: int
    price_eur: float
    original_price_eur: Optional[float] = None
    is_popular: bool = False
    bonus_description: Optional[str] = None
    stripe_price_id: Optional[str] = None

@dataclass
class PremiumPackage:
    id: str
    name: str
    price_eur: float
    interval: str  # "month" or "year"
    features: List[str]
    stripe_price_id: Optional[str] = None

class StripeService:
    def __init__(self):
        # Coin pakketten configureren (met aliases voor frontend compatibiliteit)
        starter_package = CoinPackage(
            id="starter",
            name="Starter Pack", 
            coins=500,
            price_eur=5.00,
            bonus_description="Perfect om te beginnen",
            stripe_price_id="price_1RYRN5IhYvmNDX3MGOMM0xEQ"
        )
        
        popular_package = CoinPackage(
            id="popular",
            name="Popular Choice",
            coins=1200,
            price_eur=10.00,
            original_price_eur=12.00,
            is_popular=True,
            bonus_description="+20% Bonus Coins!",
            stripe_price_id="price_1RYRN5IhYvmNDX3MpkT6nseC"
        )
        
        value_package = CoinPackage(
            id="value",
            name="Value Bundle",
            coins=2500,
            price_eur=20.00,
            original_price_eur=25.00,
            bonus_description="Best Value Per Coin",
            stripe_price_id="price_1RYRN6IhYvmNDX3MB7R1CfY7"
        )
        
        premium_package = CoinPackage(
            id="premium",
            name="Premium Stash", 
            coins=6500,
            price_eur=50.00,
            original_price_eur=70.00,
            bonus_description="Huge Bonus + VIP Tag",
            stripe_price_id="price_1RYRN7IhYvmNDX3M6YOaeTd8"
        )
        
        whale_package = CoinPackage(
            id="whale",
            name="Whale Package",
            coins=15000,
            price_eur=100.00,
            original_price_eur=150.00,
            bonus_description="The Ultimate Experience",
            stripe_price_id="price_1RYRN7IhYvmNDX3MGEf23SSF"
        )
        
        self.coin_packages = {
            # Original IDs
            "starter": starter_package,
            "popular": popular_package,
            "value": value_package,
            "premium": premium_package,
            "whale": whale_package,
            
            # Frontend aliases with underscores
            "starter_pack": starter_package,
            "popular_choice": popular_package,
            "value_bundle": value_package,
            "premium_stash": premium_package,
            "whale_package": whale_package,
        }
        
        # Premium abonnementen configureren
        self.premium_packages = {
            "premium_monthly": PremiumPackage(
                id="premium_monthly",
                name="Premium Maandelijks",
                price_eur=9.99,
                interval="month",
                features=[
                    "Unlimited dealer chats",
                    "Exclusive dealer outfits", 
                    "Priority customer support",
                    "Daily bonus coins",
                    "Special VIP status"
                ],
                stripe_price_id="price_1RYRN8IhYvmNDX3MwXFzxQXG"
            ),
            "premium_yearly": PremiumPackage(
                id="premium_yearly", 
                name="Premium Jaarlijks",
                price_eur=99.99,
                interval="year",
                features=[
                    "Alle Premium voordelen",
                    "2 maanden gratis",
                    "Extra bonus coins",
                    "Exclusive annual rewards",
                    "Premium badge"
                ],
                stripe_price_id="price_1RYRN9IhYvmNDX3M4EHboWuQ"
            )
        }

    async def create_stripe_products(self):
        """Maak Stripe producten en prijzen aan voor alle pakketten"""
        
        # Coin pakketten
        for package in self.coin_packages.values():
            try:
                # Maak product aan
                product = stripe.Product.create(
                    name=package.name,
                    description=f"{package.coins} coins - {package.bonus_description or ''}",
                    metadata={
                        "type": "coins",
                        "coins": str(package.coins),
                        "package_id": package.id
                    }
                )
                
                # Maak prijs aan
                price = stripe.Price.create(
                    product=product.id,
                    unit_amount=int(package.price_eur * 100),  # Cents
                    currency="eur"
                )
                
                package.stripe_price_id = price.id
                print(f"✅ Created coin package: {package.name} - {price.id}")
                
            except Exception as e:
                print(f"❌ Error creating coin package {package.id}: {e}")
        
        # Premium abonnementen
        for package in self.premium_packages.values():
            try:
                # Maak product aan
                product = stripe.Product.create(
                    name=package.name,
                    description=f"Premium abonnement - {', '.join(package.features[:3])}...",
                    metadata={
                        "type": "premium_subscription",
                        "interval": package.interval,
                        "package_id": package.id
                    }
                )
                
                # Maak recurring prijs aan
                price = stripe.Price.create(
                    product=product.id,
                    unit_amount=int(package.price_eur * 100),  # Cents
                    currency="eur",
                    recurring={"interval": package.interval}
                )
                
                package.stripe_price_id = price.id
                print(f"✅ Created premium package: {package.name} - {price.id}")
                
            except Exception as e:
                print(f"❌ Error creating premium package {package.id}: {e}")

    def create_checkout_session(self, package_id: str, package_type: PackageType, 
                              success_url: str, cancel_url: str, customer_email: str = None,
                              user_id: str = None):
        """Maak een Stripe Checkout sessie aan"""
        
        if package_type == PackageType.COINS:
            package = self.coin_packages.get(package_id)
            if not package or not package.stripe_price_id:
                raise ValueError(f"Invalid coin package: {package_id}")
                
            session = stripe.checkout.Session.create(
                payment_method_types=['card', 'ideal'],
                line_items=[{
                    'price': package.stripe_price_id,
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email,
                metadata={
                    "type": "coins",
                    "package_id": package_id,
                    "user_id": user_id or "",
                    "coins": str(package.coins)
                }
            )
            
        else:  # Premium subscription
            package = self.premium_packages.get(package_id)
            if not package or not package.stripe_price_id:
                raise ValueError(f"Invalid premium package: {package_id}")
                
            session = stripe.checkout.Session.create(
                payment_method_types=['card', 'ideal'],
                line_items=[{
                    'price': package.stripe_price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email,
                metadata={
                    "type": "premium_subscription",
                    "package_id": package_id,
                    "user_id": user_id or "",
                    "interval": package.interval
                }
            )
        
        return session

    def handle_webhook(self, payload: str, signature: str) -> Dict:
        """Verwerk Stripe webhook events"""
        
        endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, endpoint_secret
            )
        except ValueError:
            return {"success": False, "error": "Invalid payload"}
        except stripe.error.SignatureVerificationError:
            return {"success": False, "error": "Invalid signature"}

        # Verwerk het event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            return self._handle_successful_payment(session)
            
        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            return self._handle_subscription_payment(invoice)
            
        elif event['type'] == 'customer.subscription.deleted':
            subscription = event['data']['object']
            return self._handle_subscription_cancelled(subscription)

        return {"success": True, "message": "Event processed"}

    def _handle_successful_payment(self, session) -> Dict:
        """Verwerk succesvolle eenmalige betaling (coins)"""
        
        metadata = session.get('metadata', {})
        payment_type = metadata.get('type')
        user_id = metadata.get('user_id')
        
        if payment_type == 'coins':
            package_id = metadata.get('package_id')
            coins = int(metadata.get('coins', 0))
            
            # Hier zou je de coins toevoegen aan de gebruiker
            # await add_coins_to_user(user_id, coins)
            
            return {
                "success": True,
                "action": "add_coins",
                "user_id": user_id,
                "coins": coins,
                "package_id": package_id
            }
            
        return {"success": True, "message": "Payment processed"}

    def _handle_subscription_payment(self, invoice) -> Dict:
        """Verwerk succesvolle abonnementsbetaling"""
        
        subscription_id = invoice['subscription']
        customer_id = invoice['customer']
        
        # Hier zou je premium status activeren
        # await activate_premium_status(customer_id)
        
        return {
            "success": True,
            "action": "activate_premium",
            "subscription_id": subscription_id,
            "customer_id": customer_id
        }

    def _handle_subscription_cancelled(self, subscription) -> Dict:
        """Verwerk geannuleerd abonnement"""
        
        customer_id = subscription['customer']
        
        # Hier zou je premium status deactiveren
        # await deactivate_premium_status(customer_id)
        
        return {
            "success": True,
            "action": "deactivate_premium", 
            "customer_id": customer_id
        }

    def get_customer_subscriptions(self, customer_email: str) -> List[Dict]:
        """Haal actieve abonnementen op voor een klant"""
        
        try:
            customers = stripe.Customer.list(email=customer_email)
            
            if not customers.data:
                return []
                
            customer = customers.data[0]
            subscriptions = stripe.Subscription.list(customer=customer.id)
            
            return [
                {
                    "id": sub.id,
                    "status": sub.status,
                    "current_period_end": sub.current_period_end,
                    "plan_name": sub.items.data[0].price.product.name if sub.items.data else "Unknown"
                }
                for sub in subscriptions.data
            ]
            
        except Exception as e:
            print(f"Error fetching subscriptions: {e}")
            return []

# Singleton instantie
stripe_service = StripeService() 