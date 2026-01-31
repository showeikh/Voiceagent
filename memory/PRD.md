# VoiceAgent - Multi-Tenant Voice Assistant for Calendar Management

## Original Problem Statement
Erstelle mir einen voice agent. Mandantenfähig mit Zugriff auf google und Office 365 kalender für Termine annehmen oder informieren. Mandantenfähig und jeder kunde hat eigenen Bereich. Pro Mandant bis 2 user.

## User Personas
1. **Mandanten-Admin**: Geschäftsführer/Manager, der die Organisation verwaltet und Kalender-Integrationen einrichtet
2. **Team-Benutzer**: Mitarbeiter des Mandanten (max. 2 pro Mandant), die Termine per Sprache verwalten

## Core Requirements (Static)
- Multi-Tenant Architecture mit vollständiger Datenisolierung
- Voice Agent Interface mit OpenAI Whisper (STT) und TTS
- KI-gestützte Konversation via GPT-5.2
- Google Calendar Integration (OAuth)
- Microsoft Office 365 Calendar Integration (OAuth)
- JWT-basierte Authentifizierung mit Tenant-Kontext
- Maximal 2 Benutzer pro Mandant

## Architecture
- **Frontend**: React.js mit shadcn/ui, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **AI/Voice**: OpenAI Whisper (STT), OpenAI TTS, GPT-5.2 via Emergent Integration
- **Auth**: JWT mit bcrypt password hashing

## What's Been Implemented (Jan 31, 2026)
### Backend
- [x] Multi-tenant data model (Tenant, User, CalendarCredential, Appointment, Conversation)
- [x] JWT Authentication with tenant context
- [x] User registration and login endpoints
- [x] User management (max 2 per tenant enforced)
- [x] Calendar connections CRUD
- [x] Appointments CRUD
- [x] Voice transcription endpoint (Whisper)
- [x] Voice processing with AI response + TTS
- [x] Conversation history
- [x] Dashboard statistics

### Frontend
- [x] Landing page with German UI
- [x] Registration and Login flows
- [x] Dashboard with voice agent interface
- [x] Voice recording with Web Audio API
- [x] Calendar connections management page
- [x] Appointments management with calendar picker
- [x] Conversation history view
- [x] Settings page with tenant and user management
- [x] Responsive sidebar navigation
- [x] User dropdown menu with logout

## Prioritized Backlog

### P0 (Critical - Not Blocking MVP)
- [ ] Full OAuth2 flow for Google Calendar
- [ ] Full OAuth2 flow for Microsoft Graph

### P1 (High Priority)
- [ ] Sync appointments from connected calendars
- [ ] Push appointments to connected calendars
- [ ] Real-time calendar availability checking

### P2 (Medium Priority)
- [ ] Improved voice recognition language selection
- [ ] Multiple voice options for TTS
- [ ] Email notifications for appointments
- [ ] Dark mode theme

## Next Tasks
1. Implement full Google OAuth2 callback flow
2. Implement full Microsoft OAuth2 callback flow
3. Add appointment sync between local and external calendars
4. Add real-time calendar availability checking in voice responses
