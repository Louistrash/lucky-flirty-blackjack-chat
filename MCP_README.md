# 🔥 Firebase MCP Server Configuration

## Overzicht

Deze configuratie voegt Firebase CLI tools toe aan je ontwikkelomgeving via Model Context Protocol (MCP). Dit zorgt voor naadloze integratie van Firebase commando's in je workflow.

## 📁 Bestanden

- **`mcp_servers.json`** - Algemene MCP server configuratie
- **`claude_desktop_config.json`** - Claude Desktop specifieke configuratie
- **`setup-mcp.sh`** - Automatische setup script

## 🚀 Snelle Setup

```bash
# Voer het setup script uit
./setup-mcp.sh
```

## 🔧 Handmatige Setup

### 1. Installeer Dependencies

```bash
# Firebase CLI
npm install -g firebase-tools

# MCP packages
npm install -g @modelcontextprotocol/server-git
npm install -g @modelcontextprotocol/server-filesystem
```

### 2. Configureer Claude Desktop (macOS)

```bash
# Kopieer configuratie naar Claude Desktop
cp claude_desktop_config.json "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
```

### 3. Login bij Firebase

```bash
firebase login
firebase use flirty-chat-a045e
```

## 📋 Beschikbare MCP Servers

### 🔥 Firebase Server
- **Functie**: Firebase CLI tools en project management
- **Commando**: `npx firebase-tools@latest experimental:mcp`
- **Environment**: `FIREBASE_PROJECT=flirty-chat-a045e`

### 📂 Git Server
- **Functie**: Git repository management via MCP
- **Commando**: `@modelcontextprotocol/server-git`

### 📁 Filesystem Server
- **Functie**: Toegang tot frontend en backend directories
- **Scope**: `./frontend/src`, `./backend`

## 🛠️ Firebase Commando's via MCP

Met MCP kun je Firebase commando's direct uitvoeren:

```javascript
// Test Firebase Storage
window.testFirebaseStorage()

// Deploy Firebase Functions
firebase deploy --only functions

// Manage Firestore
firebase firestore:delete --all-collections

// Storage rules
firebase deploy --only storage
```

## 🔐 Authenticatie

De MCP server gebruikt je lokale Firebase authenticatie:

```bash
# Login (eenmalig)
firebase login

# Controleer status
firebase projects:list

# Switch project
firebase use flirty-chat-a045e
```

## 🧪 Testing

### Test Firebase Storage Connectiviteit

1. Open browser op `http://localhost:5173`
2. Open Developer Console (F12)
3. Voer uit: `window.testFirebaseStorage()`

### Verwachte Output

```javascript
// Success
✅ Firebase Storage successfully initialized and available!

// Failure  
❌ Firebase Storage initialization failed:
🔍 Error code: storage/unavailable
📝 Error message: Service storage is not available
```

## 🔄 Troubleshooting

### MCP Server Start Issues

```bash
# Check if Firebase CLI is installed
firebase --version

# Check if project is set
firebase use

# Restart Claude Desktop
killall "Claude Desktop" && open -a "Claude Desktop"
```

### Firebase Storage Issues

1. **Controleer Blaze Plan**: https://console.firebase.google.com/project/flirty-chat-a045e/settings/usage
2. **Enable Storage**: https://console.firebase.google.com/project/flirty-chat-a045e/storage
3. **Check APIs**: https://console.cloud.google.com/apis/library?project=flirty-chat-a045e

### Environment Variables

```bash
# Set Firebase project
export FIREBASE_PROJECT=flirty-chat-a045e

# Set service account (optional)
export GOOGLE_APPLICATION_CREDENTIALS=./flirty-chat-a045e-firebase-adminsdk-fbsvc-aa481051b6.json
```

## 🔗 Nuttige Links

- [Firebase Console](https://console.firebase.google.com/project/flirty-chat-a045e)
- [Cloud Storage Browser](https://console.cloud.google.com/storage/browser?project=flirty-chat-a045e)
- [Firebase Storage Rules](https://console.firebase.google.com/project/flirty-chat-a045e/storage/flirty-chat-a045e.firebasestorage.app/rules)
- [Model Context Protocol](https://github.com/modelcontextprotocol)

## 📊 Status Indicators

- 🟢 **Firebase Connected**: MCP server actief en geauthenticeerd
- 🟡 **Storage Available**: Firebase Storage service beschikbaar
- 🔴 **Issues Detected**: Configuratie of authenticatie problemen

---

**💡 Tip**: Na het wijzigen van MCP configuraties, herstart Claude Desktop voor de beste ervaring. 