# VoiceAgent SaaS Platform - Multi-Tenant Voice Assistant

## Original Problem Statement
Erstelle mir einen voice agent. Mandantenfähig mit Zugriff auf google und Office 365 kalender für Termine annehmen oder informieren. Mandantenfähig und jeder kunde hat eigenen Bereich. Pro Mandant bis 2 user. Jeder Kunde ist ein Mandant. SaaS-Dienstleistung mit:
- Firmendaten bei Registrierung (Anschrift, Steuernummer, USt-IdNr.)
- Manuelle Freischaltung durch Super-Admin
- Abrechnung nach Minuten oder Minutenpakete
- Lexoffice API für automatische Rechnungserstellung
- Twilio und Sipgate für SIP/Telefonie

## User Personas
1. **Super Admin**: Plattform-Betreiber, verwaltet Mandanten, Preise, Rechnungen
2. **Mandanten-Admin**: Geschäftsführer, registriert Firma, verwaltet Benutzer und Kalender
3. **Mandanten-Benutzer**: Mitarbeiter (max. 2 pro Mandant), nutzt Voice Agent

## Core Requirements (Static)
- Multi-Tenant Architecture mit vollständiger Datenisolierung
- Mandanten-Registrierung mit Firmendaten (Pflicht: Firma, Kontakt, Adresse, Telefon)
- Manuelle Freischaltung durch Super-Admin
- Voice Agent Interface mit OpenAI Whisper (STT) und TTS
- KI-gestützte Konversation via GPT
- Google Calendar + Office 365 Integration
- Abrechnung: Tarife (monatlich) + Minutenpakete
- Lexoffice Integration für Rechnungsstellung
- Twilio + Sipgate für Telefonie

## Architecture
- **Frontend**: React.js + shadcn/ui + Tailwind CSS
- **Backend**: FastAPI (Python) + MongoDB
- **AI/Voice**: OpenAI Whisper/TTS/GPT via Emergent LLM Key
- **Billing**: Lexoffice API
- **Telephony**: Twilio + Sipgate APIs
- **Auth**: JWT mit Tenant-Kontext + Rollen (Super Admin, Tenant Admin, User)

## What's Been Implemented (Jan 31, 2026)

### Super Admin Panel
- [x] Dashboard mit Plattform-Statistiken
- [x] Mandanten-Verwaltung (Pending/Approved/Rejected/Suspended)
- [x] Freischaltungs-Workflow
- [x] Preise & Pakete verwalten (Tarife, Minutenpakete)
- [x] Rechnungen erstellen und an Lexoffice senden
- [x] API-Einstellungen (Twilio, Sipgate, Lexoffice)

### Mandanten-Registrierung
- [x] 3-Schritt Registrierungsformular
- [x] Firmendaten: Name, Kontaktperson, E-Mail, Passwort
- [x] Adresse: Straße, Hausnr., PLZ, Stadt, Land, Telefon
- [x] Steuerdaten: Steuernummer, USt-IdNr., Website, Branche
- [x] Pending-Status nach Registrierung

### Tenant Dashboard (nach Freischaltung)
- [x] Voice Agent Interface mit Aufnahme
- [x] Kalender-Verbindungen (Google, Office 365)
- [x] Termine verwalten mit Kalender-Picker
- [x] Gesprächsverlauf
- [x] Benutzer-Verwaltung (max. 2)
- [x] Einstellungen

### Backend
- [x] Multi-tenant data models
- [x] JWT Auth mit Rollen und Tenant-Status
- [x] Usage Tracking für Abrechnung
- [x] Lexoffice Integration für Kontakte und Rechnungen
- [x] Pricing Plans und Minute Packages CRUD

## Super Admin Credentials
- **E-Mail**: admin@voiceagent.de
- **Passwort**: admin123

## API Keys Required
- **Lexoffice**: https://developers.lexware.io - API Key benötigt
- **Twilio**: Account SID, Auth Token, Phone Number
- **Sipgate**: API Token von https://console.sipgate.com

## Prioritized Backlog

### P0 (Critical)
- [ ] Twilio WebSocket für Echtzeit-Telefonie
- [ ] Sipgate Webhook-Integration
- [ ] Full OAuth2 für Google/Microsoft Calendar

### P1 (High)
- [ ] E-Mail-Benachrichtigungen bei Freischaltung
- [ ] Automatische monatliche Rechnungserstellung
- [ ] PDF-Rechnungsexport

### P2 (Medium)
- [ ] Dashboard-Analytics für Mandanten
- [ ] Telefonie-Statistiken
- [ ] Dark Mode Toggle

## Next Tasks
1. Lexoffice API-Key konfigurieren
2. Twilio/Sipgate Credentials eingeben
3. Ersten Test-Mandanten freischalten
4. Ende-zu-Ende Telefonie-Test
