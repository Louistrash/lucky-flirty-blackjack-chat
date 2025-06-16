# 🚀 Live Server Setup - adultsplaystore.com

## 📡 SSH naar je server
```bash
ssh root@85.215.43.194
cd /var/www/vhosts/adultsplaystore.com/httpdocs/backend
```

## 🔧 Stap 1: Maak .env bestand aan
```bash
# Maak .env bestand
nano .env
```

## 🔑 Stap 2: Vul API Keys in
Plak dit in je .env bestand en vul je echte keys in:

```bash
# =====================================
# OPENAI CONFIGURATION (VERPLICHT)
# =====================================
OPENAI_API_KEY=sk-proj-YOUR_REAL_OPENAI_KEY_HERE

# =====================================
# STRIPE CONFIGURATION (VERPLICHT) 
# =====================================
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_74dAEJcD01aoGOoQaCFgjzFNOSrDE1yh

# =====================================
# SERVER CONFIGURATION
# =====================================
BACKEND_URL=https://www.adultsplaystore.com
FRONTEND_URL=https://www.adultsplaystore.com
NODE_ENV=production
PORT=8001

# =====================================
# FIREBASE CONFIGURATION
# =====================================
FIREBASE_PROJECT_ID=flirty-chat-a045e
```

## 💾 Stap 3: Opslaan en afsluiten
- Druk `Ctrl + X`
- Druk `Y` 
- Druk `Enter`

## 📦 Stap 4: Installeer ontbrekende dependencies
```bash
# Installeer Pillow (voor image processing)
./venv/bin/pip install Pillow

# Installeer OpenAI library
./venv/bin/pip install openai

# Installeer alle andere dependencies
./venv/bin/pip install fastapi uvicorn stripe python-dotenv requests firebase-admin
```

## 🔄 Stap 5: Herstart server
```bash
# Stop huidige server
pkill -f "uvicorn main"

# Start nieuwe server met juiste configuratie
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001 &
```

## 🧪 Stap 6: Test de configuratie

### Test Chat API:
```bash
curl -X POST https://www.adultsplaystore.com:8001/api/ai-chat/send-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "history": [], "outfit_stage_index": 0}'
```

### Test Stripe API:
```bash
curl https://www.adultsplaystore.com:8001/api/packages
```

## 🔍 Debug Commands

### Check als .env wordt geladen:
```bash
cd /var/www/vhosts/adultsplaystore.com/httpdocs/backend
cat .env
```

### Check server logs:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Check welke processen draaien:
```bash
ps aux | grep uvicorn
```

## ⚠️ Veel Voorkomende Problemen

### Chat geeft 422 error:
- Controleer of OPENAI_API_KEY correct is ingesteld
- Zorg dat de key begint met `sk-proj-` of `sk-`

### Payments werken niet:
- Controleer STRIPE_SECRET_KEY in .env
- Zorg dat je live keys gebruikt voor productie

### Server start niet:
- Check of poort 8001 vrij is: `lsof -i :8001`
- Installeer missing dependencies

## 🎯 API Keys Verkrijgen

### OpenAI API Key:
1. Ga naar: https://platform.openai.com/api-keys
2. Klik "Create new secret key"
3. Kopieer de key (begint met sk-proj- of sk-)
4. Plak in .env: `OPENAI_API_KEY=sk-proj-...`

### Stripe Keys:
1. Ga naar: https://dashboard.stripe.com/apikeys
2. Voor LIVE: gebruik "Live" keys
3. Voor TEST: gebruik "Test" keys  
4. Kopieer Secret key en Publishable key
5. Plak in .env

## ✅ Checklist
- [ ] .env bestand aangemaakt
- [ ] OpenAI API key ingevuld
- [ ] Stripe keys ingevuld  
- [ ] Dependencies geïnstalleerd
- [ ] Server herstart
- [ ] Chat API getest
- [ ] Payments API getest

🎉 **Je server zou nu moeten werken!** 