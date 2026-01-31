# BuchungsButler – KI-Telefonassistent für Terminbuchungen

## Original Problem Statement
KI-Telefonassistent SaaS-Plattform für automatische Terminbuchungen. Zielgruppen: Arztpraxen, Freiberufler, Versicherungsbüros, Dienstleister. Manuelle Freischaltung, Abrechnung nach Minuten/Paketen, Lexoffice für Rechnungen, Twilio/Sipgate für Telefonie.

## Zielgruppen
1. **Arztpraxen & Therapeuten**: Hausärzte, Zahnärzte, Physiotherapeuten, Psychologen
2. **Freiberufler & Berater**: Anwälte, Steuerberater, Coaches, Architekten
3. **Versicherungen & Finanzen**: Versicherungsmakler, Finanzberater, Immobilienmakler
4. **Dienstleister & Handwerk**: Friseure, Kosmetikstudios, KFZ-Werkstätten, Handwerker

## User Personas
1. **Super Admin**: Plattform-Betreiber, verwaltet Kunden, Preise, Rechnungen
2. **Firmen-Admin**: Geschäftsführer/Praxisinhaber, registriert Firma, verwaltet Mitarbeiter
3. **Mitarbeiter**: Nutzt den KI-Telefonassistenten (max. 2 pro Firma)

## Core Requirements
- Firmen-Registrierung mit Firmendaten (Adresse, Steuernummer, USt-IdNr.)
- Manuelle Freischaltung durch Super-Admin
- KI-Telefonassistent mit Whisper STT, GPT, TTS
- Google Calendar + Office 365 Integration
- Abrechnung: Tarife + Minutenpakete
- Lexoffice für Rechnungen
- Twilio + Sipgate für Telefonie
- DSGVO-konform

## SEO Implementierung
- Meta-Tags für alle Seiten
- Open Graph Tags
- Strukturierte Daten (JSON-LD)
- Semantische HTML-Struktur
- Deutsche Sprache (lang="de")
- Keyword-optimierte Inhalte
- Canonical URLs

## Was wurde implementiert (Jan 31, 2026)

### Landing Page
- [x] Branchenspezifische Inhalte (Arztpraxen, Freiberufler, Versicherungen, Dienstleister)
- [x] Testimonials mit Sterne-Bewertungen
- [x] Feature-Übersicht
- [x] CTA-Sections
- [x] SEO-optimierter Footer mit Navigation
- [x] Meta-Tags und strukturierte Daten

### Super Admin Panel
- [x] Dashboard mit Plattform-Statistiken
- [x] Kunden-Freischaltung (Pending/Approved/Rejected/Suspended)
- [x] Preise & Pakete verwalten
- [x] Rechnungen erstellen und an Lexoffice senden
- [x] API-Einstellungen (Twilio, Sipgate, Lexoffice)

### Kunden-Dashboard
- [x] KI-Sprachassistent Interface
- [x] Kalender-Verbindungen
- [x] Termine verwalten
- [x] Gesprächsverlauf
- [x] Mitarbeiter-Verwaltung (max. 2)

### Technisch
- [x] Responsive Design (Mobile, Tablet, Desktop)
- [x] React Helmet für dynamische Meta-Tags
- [x] DSGVO-konforme Hinweise

## Super Admin Login
- **E-Mail:** admin@buchungsbutler.de
- **Passwort:** admin123

## Benötigte API-Keys
- **Lexoffice:** https://developers.lexware.io
- **Twilio:** Account SID, Auth Token, Phone Number
- **Sipgate:** API Token

## Nächste Schritte
1. Lexoffice API-Key konfigurieren
2. Twilio/Sipgate Credentials eingeben
3. Impressum und Datenschutz-Seiten erstellen
4. E-Mail-Benachrichtigungen implementieren
5. Echte Telefonie-Integration testen
