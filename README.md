# Lucky Flirty Chat

Een moderne chat applicatie gebouwd met React + TypeScript frontend en FastAPI backend.

## 🚀 Features

- **React Frontend**: Moderne TypeScript React applicatie met Vite
- **FastAPI Backend**: Snelle Python API server met Firebase integratie
- **Firebase Storage**: Cloud opslag voor afbeeldingen en bestanden
- **Firebase Authentication**: Veilige gebruikersauthenticatie
- **Firebase Firestore**: NoSQL database voor realtime data

## 📦 Project Structuur

```
├── frontend/          # React + TypeScript frontend
├── backend/           # FastAPI Python backend
├── firebase.json      # Firebase configuratie
├── storage.rules      # Firebase Storage regels
└── firestore.rules    # Firestore beveiligingsregels
```

## 🛠️ Development Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🔥 Firebase Setup

Dit project gebruikt Firebase voor:
- Authentication (gebruikerslogin)
- Firestore (database)
- Storage (bestand opslag)
- Functions (serverless backend code)

Zie `MCP_README.md` voor gedetailleerde Firebase MCP configuratie.
