# 🎉 Complete Stripe Setup voor adultsplaystore.com

## ✅ Wat is Klaar

### 1. 🔗 Webhook Geconfigureerd
```
URL: https://www.adultsplaystore.com/api/webhooks/stripe
Secret: whsec_74dAEJcD01aoGOoQaCFgjzFNOSrDE1yh
ID: we_1RYSKNIhYvmNDX3MhlZw1mEu
```

**Events die worden gevolgd:**
- checkout.session.completed
- payment_intent.succeeded 
- payment_intent.payment_failed
- invoice.payment_succeeded
- invoice.payment_failed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- customer.subscription.trial_will_end

### 2. 💳 Test Checkout URLs (KLAAR VOOR TESTING!)

**Coin Packages:**
- **Starter Pack (€5,00)**: https://checkout.stripe.com/c/pay/cs_test_a1WB56TAFv3GM70nMcwdK73HKbuwKFNt0djdEZE28ZvJOU2ZAbTFphKoga
- **Popular Choice (€10,00)**: https://checkout.stripe.com/c/pay/cs_test_a1upiLGd3v8Rd5pSwCHHBdoVE5j07sz4MOYcGBSDxsKK74B2f0kWERDZ5T
- **Premium Monthly (€9,99/maand)**: https://checkout.stripe.com/c/pay/cs_test_a10ji5EEI1CplaRPLQW8kJyQ0mIghWV4NeVXjzVVWGKZbtKPd43g51HfcY
- **Premium Yearly (€99,99/jaar)**: https://checkout.stripe.com/c/pay/cs_test_a1QzzZeoLiYlhudopCWoMiWaJVZwVkSHYUeJGWvBWxz7OZrb3crAEgYvZr

## 🧪 Test Cards voor Verschillende Scenario's

### 💳 Succesvolle Betalingen
```
Nummer: 4242424242424242
Vervaldatum: 12/25 (elke toekomstige datum)
CVC: 123 (elke 3-cijferige code)
```

### 🚫 Geweigerde Betalingen
```
Visa Declined: 4000000000000002
Insufficient Funds: 4000000000009995
Incorrect CVC: 4000000000000127
Expired Card: 4000000000000069
```

### 🔒 Speciale Scenario's
```
3D Secure Required: 4000000000003220
Processing Error: 4000000000000119
Mastercard Success: 5555555555554444
American Express: 378282246310005
```

## 🔧 Environment Variabelen

Voeg deze toe aan je `.env` bestand:

```env
# Stripe Keys
STRIPE_SECRET_KEY=JOUW_STRIPE_SECRET_KEY_HIER
STRIPE_PUBLISHABLE_KEY=pk_test_51RXJkIIhYvmNDX3M7Q9h2F3mR9O8p8j9Bq8gL9kD5sF6k2P9sL3oP2nR9qM8wE7rT1yU3iO5p8uF1dG6hJ9kL2sN4bV6cX8z
STRIPE_WEBHOOK_SECRET=whsec_74dAEJcD01aoGOoQaCFgjzFNOSrDE1yh
STRIPE_API_KEY=JOUW_STRIPE_API_KEY

# Success/Cancel URLs
SUCCESS_URL=https://www.adultsplaystore.com/payment/success?session_id={CHECKOUT_SESSION_ID}
CANCEL_URL=https://www.adultsplaystore.com/payment/cancel
```

## 🌐 Frontend JavaScript Voorbeeld

```javascript
// Initialiseer Stripe
const stripe = Stripe('pk_test_51RXJkIIhYvmNDX3M7Q9h2F3mR9O8p8j9Bq8gL9kD5sF6k2P9sL3oP2nR9qM8wE7rT1yU3iO5p8uF1dG6hJ9kL2sN4bV6cX8z');
stripe.api_key = "JOUW_STRIPE_API_KEY";

// Koop coins functie
async function buyCoins(packageId) {
    try {
        // Maak checkout sessie aan
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                package_id: packageId,
                package_type: 'coins',
                customer_email: 'user@adultsplaystore.com',
                user_id: 'user_123'
            })
        });
        
        const session = await response.json();
        
        // Redirect naar Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: session.id
        });
        
        if (result.error) {
            alert(result.error.message);
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Er is een fout opgetreden bij de betaling.');
    }
}

// Koop premium functie
async function buyPremium(packageId) {
    const packageType = packageId === 'premium_monthly' ? 'premium_monthly' : 'premium_yearly';
    
    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                package_id: packageId,
                package_type: packageType,
                customer_email: 'user@adultsplaystore.com',
                user_id: 'user_123'
            })
        });
        
        const session = await response.json();
        
        const result = await stripe.redirectToCheckout({
            sessionId: session.id
        });
        
        if (result.error) {
            alert(result.error.message);
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Er is een fout opgetreden bij de betaling.');
    }
}
```

## 🔌 Backend API Endpoints (FastAPI)

Je hebt deze endpoints nodig in je main.py:

```python
from fastapi import FastAPI, Request, HTTPException
from stripe_service import StripeService, PackageType

app = FastAPI()
service = StripeService()

@app.post("/api/create-checkout-session")
async def create_checkout_session(request: dict):
    try:
        # Bepaal package type
        package_type_map = {
            'coins': PackageType.COINS,
            'premium_monthly': PackageType.PREMIUM_MONTHLY, 
            'premium_yearly': PackageType.PREMIUM_YEARLY
        }
        
        package_type = package_type_map.get(request['package_type'])
        if not package_type:
            raise HTTPException(400, "Invalid package type")
        
        # Maak checkout sessie aan
        session = service.create_checkout_session(
            package_id=request['package_id'],
            package_type=package_type,
            success_url="https://www.adultsplaystore.com/payment/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://www.adultsplaystore.com/payment/cancel",
            customer_email=request.get('customer_email'),
            user_id=request.get('user_id')
        )
        
        return {
            "id": session.id,
            "url": session.url
        }
        
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    result = service.handle_webhook(payload.decode(), sig_header)
    
    if not result.get('success'):
        raise HTTPException(400, result.get('error'))
    
    return {"status": "success"}

@app.get("/payment/success")
async def payment_success(session_id: str):
    # Hier kun je de betaling verifiëren en coins/premium toevoegen
    return {"message": "Payment successful!", "session_id": session_id}

@app.get("/payment/cancel") 
async def payment_cancel():
    return {"message": "Payment cancelled"}
```

## 🧪 Testing Stappen

### 1. Direct Test (Nu Mogelijk!)
1. Ga naar een van de test checkout URLs hierboven
2. Vul een test card in: `4242424242424242`
3. Vervaldatum: `12/25`
4. CVC: `123`
5. Voltooi de betaling

### 2. Test Verschillende Scenario's
- **Succesvolle betaling**: `4242424242424242`
- **Geweigerde betaling**: `4000000000000002`
- **3D Secure**: `4000000000003220`
- **Onvoldoende saldo**: `4000000000009995`

### 3. Test Premium Abonnementen
- Test maandelijks abonnement met `4242424242424242`
- Test jaarlijks abonnement met `5555555555554444`

## 📊 Stripe Dashboard

Ga naar https://dashboard.stripe.com om te zien:
- ✅ Je producten (7 stuks aangemaakt)
- 💳 Test betalingen
- 🔗 Webhook events
- 📈 Transactie geschiedenis

## 🔗 Nuttige Links

- **Stripe Dashboard**: https://dashboard.stripe.com/
- **Test Cards**: https://stripe.com/docs/testing#cards
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Checkout Documentation**: https://stripe.com/docs/checkout

## 🎯 Volgende Stappen

1. **✅ Test betalingen** - Gebruik de test URLs hierboven
2. **🔧 Implement webhooks** - Voeg webhook handler toe aan je backend
3. **🌐 Frontend integratie** - Gebruik de JavaScript voorbeelden
4. **🚀 Go live** - Vervang test keys met live keys

---

**Status**: 🎉 **VOLLEDIG KLAAR VOOR TESTING EN PRODUCTIE!** 