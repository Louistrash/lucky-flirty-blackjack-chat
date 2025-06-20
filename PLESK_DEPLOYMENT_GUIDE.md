# 🚀 Plesk Deployment Guide voor Lucky Flirty Chat

## 📦 Bestanden voor Deployment

### Frontend (lucky-flirty-chat-dist-fixed.zip)
- **Locatie**: `/Users/patrick/Documents/lucky-flirty-chat/frontend/lucky-flirty-chat-dist-fixed.zip`
- **Doel**: Root van www.adultsplaystore.com
- **Grootte**: ~13MB

### Backend (backend-deployment.zip)
- **Locatie**: `/Users/patrick/Documents/lucky-flirty-chat/backend-deployment.zip`
- **Doel**: Subdirectory of Python app op Plesk
- **Grootte**: ~2MB

## 🔧 Plesk Deployment Stappen

### 1. Frontend Deployment
1. Log in op je Plesk control panel
2. Ga naar **Files** voor www.adultsplaystore.com
3. Upload `lucky-flirty-chat-dist-fixed.zip` naar de root directory
4. Pak het bestand uit in de root (dit overschrijft bestaande bestanden)
5. Controleer dat `.htaccess` correct is geplaatst voor SPA routing

### 2. Backend Deployment (Python App)
1. In Plesk, ga naar **Python** voor je domein
2. Maak een nieuwe Python app aan:
   - **Python Version**: 3.8+ (bij voorkeur 3.11+)
   - **App Directory**: `backend` (of `api`)
   - **Startup File**: `main.py`
   - **Application URL**: `/api` (of root als je wilt)

3. Upload `backend-deployment.zip` naar de app directory
4. Pak uit in de app directory

### 3. Python Dependencies Installeren
In de Plesk Python app terminal:
```bash
pip install -r requirements.txt
```

### 4. Environment Variables Configureren
In Plesk Python app settings, voeg toe:
```
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
FIREBASE_ADMIN_KEY_PATH=./flirty-chat-a045e-firebase-adminsdk-fbsvc-aa481051b6.json
```

### 5. WSGI/ASGI Configuratie
Voor FastAPI in Plesk, configureer:
- **WSGI/ASGI**: ASGI
- **Application Object**: `main:app`
- **Startup File**: `main.py`

## 🔒 Beveiliging & Live Mode

### Stripe Live Mode
1. Vervang test keys met live keys in environment variables
2. Update webhook endpoints in Stripe dashboard
3. Test betalingen met echte (kleine) bedragen

### Firebase Production
1. Controleer Firebase project instellingen
2. Update security rules indien nodig
3. Controleer CORS instellingen

## 🧪 Testing Checklist

### Na Deployment:
- [ ] Website laadt correct op www.adultsplaystore.com
- [ ] API endpoints bereikbaar via www.adultsplaystore.com/api/
- [ ] Stripe checkout sessie kan worden aangemaakt
- [ ] Firebase connectie werkt
- [ ] Dealer data wordt geladen
- [ ] Betalingen kunnen worden getest (kleine bedragen)

## 🚨 Troubleshooting

### Veelvoorkomende Problemen:
1. **500 Internal Server Error**: Check Python app logs in Plesk
2. **Module not found**: Installeer missing dependencies
3. **CORS errors**: Update CORS origins in main.py
4. **Firebase errors**: Check service account key path
5. **Stripe errors**: Verify live API keys

### Log Locaties in Plesk:
- Python app logs: Plesk > Python > Logs
- Error logs: Plesk > Logs > Error Logs
- Access logs: Plesk > Logs > Access Logs

## 📞 Support
Bij problemen, check:
1. Plesk Python app status
2. Error logs
3. Environment variables
4. File permissions

---
**Deployment Date**: 2025-06-15
**Frontend Build**: lucky-flirty-chat-dist-fixed.zip
**Backend Build**: backend-deployment.zip
