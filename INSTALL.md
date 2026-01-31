# BuchungsButler - Server-Installationsanleitung

Diese Anleitung beschreibt die Installation von BuchungsButler auf einem eigenen Linux-Server (Ubuntu/Debian).

---

## Inhaltsverzeichnis

1. [Voraussetzungen](#1-voraussetzungen)
2. [Code von GitHub klonen](#2-code-von-github-klonen)
3. [MongoDB installieren](#3-mongodb-installieren)
4. [Backend installieren](#4-backend-installieren)
5. [Frontend installieren](#5-frontend-installieren)
6. [Nginx als Reverse Proxy](#6-nginx-als-reverse-proxy)
7. [SSL-Zertifikat mit Let's Encrypt](#7-ssl-zertifikat-mit-lets-encrypt)
8. [Systemd Services einrichten](#8-systemd-services-einrichten)
9. [Firewall konfigurieren](#9-firewall-konfigurieren)
10. [Erste Schritte nach Installation](#10-erste-schritte-nach-installation)
11. [Wartung und Updates](#11-wartung-und-updates)
12. [Fehlerbehebung](#12-fehlerbehebung)

---

## 1. Voraussetzungen

### Server-Anforderungen
- **Betriebssystem:** Ubuntu 22.04 LTS oder Debian 11+ (empfohlen)
- **RAM:** Mindestens 2 GB (4 GB empfohlen)
- **CPU:** 2 Cores
- **Speicher:** 20 GB SSD
- **Root-Zugang:** Ja

### Software-Anforderungen
- Node.js 18+ und Yarn
- Python 3.10+
- MongoDB 6.0+
- Nginx
- Git

### Domain & DNS
- Eine Domain (z.B. `buchungsbutler.de`)
- DNS A-Record zeigt auf die Server-IP

---

## 2. Code von GitHub klonen

### 2.1 In Emergent: Code zu GitHub exportieren
1. Klicken Sie auf **"Save to GitHub"** in der Emergent-Oberfläche
2. Wählen Sie ein Repository (neu oder bestehend)
3. Der Code wird automatisch gepusht

### 2.2 Auf dem Server: Repository klonen

```bash
# Als root anmelden
ssh root@ihre-server-ip

# System aktualisieren
apt update && apt upgrade -y

# Git installieren
apt install -y git

# Projektverzeichnis erstellen
mkdir -p /var/www
cd /var/www

# Repository klonen (ersetzen Sie mit Ihrer GitHub-URL)
git clone https://github.com/IHR-USERNAME/buchungsbutler.git
cd buchungsbutler
```

---

## 3. MongoDB installieren

```bash
# MongoDB GPG Key importieren
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Repository hinzufügen (Ubuntu 22.04)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# MongoDB installieren
apt update
apt install -y mongodb-org

# MongoDB starten und aktivieren
systemctl start mongod
systemctl enable mongod

# Status prüfen
systemctl status mongod
```

### MongoDB absichern (Optional aber empfohlen)

```bash
# MongoDB Shell öffnen
mongosh

# Admin-Benutzer erstellen
use admin
db.createUser({
  user: "buchungsbutler_admin",
  pwd: "IHR_SICHERES_PASSWORT",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Datenbank-Benutzer erstellen
use buchungsbutler_db
db.createUser({
  user: "buchungsbutler",
  pwd: "IHR_DB_PASSWORT",
  roles: [ { role: "readWrite", db: "buchungsbutler_db" } ]
})

exit
```

```bash
# MongoDB Authentifizierung aktivieren
nano /etc/mongod.conf

# Fügen Sie hinzu:
# security:
#   authorization: enabled

# MongoDB neustarten
systemctl restart mongod
```

---

## 4. Backend installieren

### 4.1 Python und pip installieren

```bash
# Python 3.10+ installieren
apt install -y python3 python3-pip python3-venv

# Python Version prüfen
python3 --version
```

### 4.2 Virtual Environment erstellen

```bash
cd /var/www/buchungsbutler/backend

# Virtual Environment erstellen
python3 -m venv venv

# Aktivieren
source venv/bin/activate

# Pip aktualisieren
pip install --upgrade pip
```

### 4.3 Abhängigkeiten installieren

```bash
# Requirements installieren
pip install -r requirements.txt

# Falls emergentintegrations fehlt:
pip install emergentintegrations
```

### 4.4 Environment-Variablen konfigurieren

```bash
# .env Datei erstellen/bearbeiten
nano /var/www/buchungsbutler/backend/.env
```

Inhalt der `.env` Datei:

```env
# MongoDB Verbindung
MONGO_URL=mongodb://localhost:27017
# Oder mit Authentifizierung:
# MONGO_URL=mongodb://buchungsbutler:IHR_DB_PASSWORT@localhost:27017/buchungsbutler_db

# Datenbank Name
DB_NAME=buchungsbutler_db

# CORS - Ihre Domain
CORS_ORIGINS=https://buchungsbutler.de,https://www.buchungsbutler.de

# Sicherheit - ÄNDERN SIE DIESEN KEY!
SECRET_KEY=ihr-sehr-sicherer-geheimer-schluessel-min-32-zeichen

# Emergent LLM Key (von Emergent Platform)
EMERGENT_LLM_KEY=sk-emergent-xxxxxxxxxxxxx

# Twilio (optional - für Telefonie)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Sipgate (optional - für Telefonie)
SIPGATE_API_TOKEN=

# Lexoffice (optional - für Rechnungen)
LEXOFFICE_API_KEY=
```

### 4.5 Backend testen

```bash
# Im venv bleiben
cd /var/www/buchungsbutler/backend
source venv/bin/activate

# Server testweise starten
uvicorn server:app --host 0.0.0.0 --port 8001

# Sollte ausgeben: "Uvicorn running on http://0.0.0.0:8001"
# Mit Ctrl+C beenden
```

---

## 5. Frontend installieren

### 5.1 Node.js und Yarn installieren

```bash
# Node.js 18 LTS installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Yarn installieren
npm install -g yarn

# Versionen prüfen
node --version
yarn --version
```

### 5.2 Abhängigkeiten installieren

```bash
cd /var/www/buchungsbutler/frontend

# Abhängigkeiten installieren
yarn install
```

### 5.3 Environment-Variablen konfigurieren

```bash
# .env Datei erstellen/bearbeiten
nano /var/www/buchungsbutler/frontend/.env
```

Inhalt der `.env` Datei:

```env
# Backend URL - Ihre Domain mit /api Prefix
REACT_APP_BACKEND_URL=https://buchungsbutler.de
```

### 5.4 Frontend bauen (Production Build)

```bash
cd /var/www/buchungsbutler/frontend

# Production Build erstellen
yarn build

# Der Build liegt jetzt in /var/www/buchungsbutler/frontend/build
```

---

## 6. Nginx als Reverse Proxy

### 6.1 Nginx installieren

```bash
apt install -y nginx
```

### 6.2 Nginx Konfiguration erstellen

```bash
nano /etc/nginx/sites-available/buchungsbutler
```

Inhalt:

```nginx
server {
    listen 80;
    server_name buchungsbutler.de www.buchungsbutler.de;

    # Frontend (React Build)
    location / {
        root /var/www/buchungsbutler/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache für statische Assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # Für File Uploads
        client_max_body_size 50M;
    }

    # Gzip Kompression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
    gzip_disable "MSIE [1-6]\.";
}
```

### 6.3 Konfiguration aktivieren

```bash
# Symlink erstellen
ln -s /etc/nginx/sites-available/buchungsbutler /etc/nginx/sites-enabled/

# Default-Seite entfernen (optional)
rm /etc/nginx/sites-enabled/default

# Konfiguration testen
nginx -t

# Nginx neustarten
systemctl restart nginx
systemctl enable nginx
```

---

## 7. SSL-Zertifikat mit Let's Encrypt

```bash
# Certbot installieren
apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat anfordern
certbot --nginx -d buchungsbutler.de -d www.buchungsbutler.de

# E-Mail eingeben und Bedingungen akzeptieren
# Wählen Sie "Redirect" für automatische HTTPS-Weiterleitung

# Automatische Erneuerung testen
certbot renew --dry-run
```

---

## 8. Systemd Services einrichten

### 8.1 Backend Service erstellen

```bash
nano /etc/systemd/system/buchungsbutler-backend.service
```

Inhalt:

```ini
[Unit]
Description=BuchungsButler Backend API
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/buchungsbutler/backend
Environment="PATH=/var/www/buchungsbutler/backend/venv/bin"
ExecStart=/var/www/buchungsbutler/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001 --workers 2
Restart=always
RestartSec=10

# Logging
StandardOutput=append:/var/log/buchungsbutler/backend.log
StandardError=append:/var/log/buchungsbutler/backend-error.log

[Install]
WantedBy=multi-user.target
```

### 8.2 Log-Verzeichnis erstellen

```bash
mkdir -p /var/log/buchungsbutler
chown www-data:www-data /var/log/buchungsbutler
```

### 8.3 Berechtigungen setzen

```bash
# Eigentümer ändern
chown -R www-data:www-data /var/www/buchungsbutler
```

### 8.4 Service aktivieren und starten

```bash
# Systemd neu laden
systemctl daemon-reload

# Service aktivieren (Autostart)
systemctl enable buchungsbutler-backend

# Service starten
systemctl start buchungsbutler-backend

# Status prüfen
systemctl status buchungsbutler-backend
```

---

## 9. Firewall konfigurieren

```bash
# UFW installieren (falls nicht vorhanden)
apt install -y ufw

# SSH erlauben (WICHTIG - sonst sperren Sie sich aus!)
ufw allow ssh

# HTTP und HTTPS erlauben
ufw allow 'Nginx Full'

# Firewall aktivieren
ufw enable

# Status prüfen
ufw status
```

---

## 10. Erste Schritte nach Installation

### 10.1 Installation testen

```bash
# Backend prüfen
curl http://localhost:8001/api/

# Sollte ausgeben: {"message":"BuchungsButler SaaS API","version":"2.0.0"}
```

Öffnen Sie im Browser: `https://buchungsbutler.de`

### 10.2 Super Admin Login

- **URL:** https://buchungsbutler.de/login
- **E-Mail:** admin@buchungsbutler.de
- **Passwort:** admin123

**WICHTIG:** Ändern Sie das Admin-Passwort sofort nach dem ersten Login!

### 10.3 API-Keys konfigurieren

Im Admin-Panel unter **Einstellungen**:
1. Lexoffice API-Key eintragen
2. Twilio Credentials eintragen (falls gewünscht)
3. Sipgate Token eintragen (falls gewünscht)

---

## 11. Wartung und Updates

### 11.1 Updates einspielen

```bash
cd /var/www/buchungsbutler

# Änderungen von GitHub holen
git pull origin main

# Backend aktualisieren
cd backend
source venv/bin/activate
pip install -r requirements.txt
systemctl restart buchungsbutler-backend

# Frontend neu bauen
cd ../frontend
yarn install
yarn build

# Nginx neu laden (für neue statische Dateien)
systemctl reload nginx
```

### 11.2 Logs prüfen

```bash
# Backend Logs
tail -f /var/log/buchungsbutler/backend.log
tail -f /var/log/buchungsbutler/backend-error.log

# Nginx Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 11.3 Backup erstellen

```bash
# MongoDB Backup
mongodump --db buchungsbutler_db --out /backup/mongodb/$(date +%Y%m%d)

# Oder als Cronjob (täglich um 3 Uhr)
echo "0 3 * * * mongodump --db buchungsbutler_db --out /backup/mongodb/\$(date +\%Y\%m\%d)" | crontab -
```

### 11.4 Service neustarten

```bash
# Backend neustarten
systemctl restart buchungsbutler-backend

# Nginx neustarten
systemctl restart nginx

# Alle Services neustarten
systemctl restart mongod buchungsbutler-backend nginx
```

---

## 12. Fehlerbehebung

### Backend startet nicht

```bash
# Logs prüfen
journalctl -u buchungsbutler-backend -f

# Manuell testen
cd /var/www/buchungsbutler/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### MongoDB Verbindungsfehler

```bash
# MongoDB Status
systemctl status mongod

# MongoDB Logs
tail -f /var/log/mongodb/mongod.log

# Verbindung testen
mongosh
```

### 502 Bad Gateway

```bash
# Backend läuft?
systemctl status buchungsbutler-backend

# Port belegt?
netstat -tlnp | grep 8001

# Nginx Konfiguration prüfen
nginx -t
```

### SSL-Zertifikat Probleme

```bash
# Zertifikat erneuern
certbot renew

# Zertifikat Status
certbot certificates
```

### Berechtigungsfehler

```bash
# Berechtigungen reparieren
chown -R www-data:www-data /var/www/buchungsbutler
chmod -R 755 /var/www/buchungsbutler
```

---

## Schnellreferenz - Wichtige Befehle

```bash
# Services
systemctl start|stop|restart|status buchungsbutler-backend
systemctl start|stop|restart|status nginx
systemctl start|stop|restart|status mongod

# Logs
tail -f /var/log/buchungsbutler/backend.log
tail -f /var/log/nginx/error.log

# Updates
cd /var/www/buchungsbutler && git pull
systemctl restart buchungsbutler-backend

# Backup
mongodump --db buchungsbutler_db --out /backup/
```

---

## Support

Bei Fragen oder Problemen:
- GitHub Issues: [Ihr Repository]
- E-Mail: support@buchungsbutler.de

---

**Viel Erfolg mit BuchungsButler!** 🚀
