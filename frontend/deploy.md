# Deployment Instructies voor Adults Play Store

## 📦 Productie Build Maken

```bash
cd frontend
npm run build
```

Dit maakt een `dist` map aan met alle geoptimaliseerde bestanden.

## 🌐 Website Integratie

### Upload naar www.adultsplaystore.com

1. **Upload de complete `dist` folder naar je website**
   - Upload naar: `/public_html/blackjack/` 
   - Of maak een subdirectory: `/blackjack/`

2. **Bestand Structuur op Server:**
```
/public_html/blackjack/
├── index.html
├── assets/
│   ├── css files
│   ├── js files
│   └── images
├── casino-pattern.png
└── andere assets
```

### 🔧 Server Configuratie

Voor Apache (.htaccess):
```apache
RewriteEngine On
RewriteBase /blackjack/

# Handle Angular/React Router (History API)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /blackjack/index.html [L]

# Gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache headers
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

### 🎯 Functionaliteit

✅ **Homepage Carousel**: Toont alle beschikbare dealers
✅ **Klik Functionaliteit**: 
  - Klik op dealer image → Login/Register (als niet ingelogd)
  - Klik op "Speel Nu" button → Login/Register (als niet ingelogd)
✅ **Authenticatie**: Firebase login/register systeem
✅ **Responsive**: Werkt op desktop, tablet en mobiel
✅ **SEO Geoptimaliseerd**: Meta tags voor Adults Play Store

### 🔗 URLs

- **Homepage**: `https://www.adultsplaystore.com/blackjack/`
- **Login**: `https://www.adultsplaystore.com/blackjack/login`
- **Register**: `https://www.adultsplaystore.com/blackjack/register`
- **Game**: `https://www.adultsplaystore.com/blackjack/game/{dealer-id}`

### ⚙️ Backend Configuratie

⚠️ **Belangrijk**: Update je backend API URL's naar:
- **API**: `https://api.adultsplaystore.com`
- **WebSocket**: `wss://api.adultsplaystore.com`

### 🎨 Branding

De app is geconfigureerd voor Adults Play Store met:
- ✅ Adults Play Store branding in metadata
- ✅ Luxury casino design
- ✅ Nederlandse taal ondersteuning
- ✅ SEO geoptimaliseerde URLs

### 🚀 Go-Live Checklist

- [ ] Upload dist folder naar `/blackjack/` directory
- [ ] Configureer .htaccess voor routing
- [ ] Test homepage carousel
- [ ] Test login/register flow
- [ ] Test dealer selection
- [ ] Controleer mobile responsiveness
- [ ] Verify SEO meta tags
- [ ] Backup bestaande website bestanden

### 📞 Support

Voor technische vragen over de deployment, neem contact op met je webmaster of hosting provider. 