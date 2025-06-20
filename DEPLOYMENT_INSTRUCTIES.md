# 🚀 Lucky Flirty Chat - Deployment Instructies

## Problemen Opgelost ✅

### 1. 🤖 AI Chat werkt nu in het Engels als standaardtaal
- Standaardtaal is nu Engels
- Detecteert automatisch of gebruiker Nederlands/Duits spreekt
- Reageert in juiste taal per bericht

### 2. 💳 Stripe Payment Configuration Fixed
- Betere error handling voor ontbrekende API keys
- Fallback waarden voor development
- Duidelijke instructies voor API key setup

### 3. 📦 Dependencies automatisch installeren
- Install script voor alle benodigde packages
- Pillow dependency toegevoegd voor image processing
- Firebase dependencies correct geconfigureerd

### 4. 🔧 Environment Setup Geautomatiseerd
- Setup script maakt automatisch .env file
- Duidelijke placeholders voor alle API keys
- Productie-klare configuratie

## Quick Start 🏃‍♂️

### Stap 1: Setup en Dependencies
```bash
cd backend
python setup_production.py
python install_deps.py
```

### Stap 2: API Keys Configureren
Bewerk het `.env` bestand en vul je echte API keys in:

```bash
# OpenAI API Key (VERPLICHT voor chat)
OPENAI_API_KEY=sk-proj-your_real_openai_api_key_here

# Stripe Keys (VERPLICHT voor payments)
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key_here
```

### Stap 3: Server Starten
```bash
python start_server.py
```

## 🌐 Productie Deployment (Plesk)

### 1. Upload Backend Files
Upload alle backend bestanden naar je Plesk hosting:
```
/var/www/vhosts/adultsplaystore.com/httpdocs/backend/
```

### 2. Install Python Dependencies
```bash
cd /var/www/vhosts/adultsplaystore.com/httpdocs/backend
python3 install_deps.py
```

### 3. Configureer Environment
```bash
python3 setup_production.py
nano .env  # Voeg je echte API keys toe
```

### 4. Start Server
```bash
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001 &
```

## 🔑 API Keys Verkrijgen

### OpenAI API Key (Voor Chat)
1. Ga naar: https://platform.openai.com/api-keys
2. Maak een nieuwe API key
3. Kopieer en plak in .env: `OPENAI_API_KEY=sk-proj-...`

### Stripe Keys (Voor Payments)
1. Ga naar: https://dashboard.stripe.com/apikeys
2. Kopieer Secret key: `STRIPE_SECRET_KEY=sk_live_...`
3. Kopieer Publishable key: `STRIPE_PUBLISHABLE_KEY=pk_live_...`

## 🧪 Testing

### Test AI Chat
```bash
curl -X POST http://localhost:8001/api/ai-chat/send-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "history": [], "outfit_stage_index": 0}'
```

### Test Stripe
```bash
curl http://localhost:8001/api/packages
```

## 🎯 Belangrijke Wijzigingen

### AI Chat Standaardtaal
- **Standaardtaal**: Engels
- **Auto-detectie**: Reageert in gebruikerstaal als detecteerbaar
- **Fallback**: Altijd Engels bij onduidelijkheid

### Stripe Payment
- **Error handling**: Geen crash meer bij ontbrekende keys
- **Development mode**: Werkt met placeholder keys
- **Production ready**: Eenvoudige key configuratie

### Dependencies
- **Pillow**: Toegevoegd voor image processing
- **Firebase**: Correct geconfigureerd
- **OpenAI**: Laatste versie met fallbacks

## 🔧 Troubleshooting

### Chat werkt niet?
1. Controleer OPENAI_API_KEY in .env
2. Zorg dat de key begint met `sk-proj-` of `sk-`
3. Test met: `curl http://localhost:8001/api/ai-chat/send-message`

### Payments werken niet?
1. Controleer STRIPE_SECRET_KEY in .env
2. Zorg dat webhooks zijn ingesteld
3. Test met: `curl http://localhost:8001/api/packages`

### Server start niet?
1. Run: `python install_deps.py`
2. Controleer Python versie (3.8+)
3. Controleer dat poort 8001 vrij is

## 📞 Support

Bij problemen:
1. Check logs: `tail -f server.log`
2. Test endpoints individueel
3. Controleer .env file configuratie

🎉 **Succes met je deployment!** 