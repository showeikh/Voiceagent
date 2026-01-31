from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'voice-agent-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Emergent LLM Key for OpenAI
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="Voice Agent API")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= MODELS =============

class TenantCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class TenantResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    created_at: str

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    tenant_id: str
    email: str
    username: str
    is_active: bool
    created_at: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    tenant_id: str
    user_id: str
    username: str

class TokenData(BaseModel):
    user_id: str
    tenant_id: str
    email: str

class CalendarCredentialCreate(BaseModel):
    provider: str  # "google" or "microsoft"
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: str
    email: str

class CalendarCredentialResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    tenant_id: str
    provider: str
    email: str
    connected_at: str

class AppointmentCreate(BaseModel):
    title: str
    start_time: str
    end_time: str
    description: Optional[str] = None
    calendar_provider: str

class AppointmentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    tenant_id: str
    title: str
    start_time: str
    end_time: str
    description: Optional[str] = None
    calendar_provider: str
    created_at: str

class VoiceProcessRequest(BaseModel):
    transcription: str

class VoiceProcessResponse(BaseModel):
    transcription: str
    response: str
    audio_base64: Optional[str] = None
    calendar_action: Optional[dict] = None

class ConversationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    tenant_id: str
    user_id: str
    transcription: str
    agent_response: str
    created_at: str

# ============= AUTH HELPERS =============

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenData:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        tenant_id = payload.get("tenant_id")
        email = payload.get("email")
        if not user_id or not tenant_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return TokenData(user_id=user_id, tenant_id=tenant_id, email=email)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register_tenant(tenant: TenantCreate):
    """Register a new tenant with admin user"""
    # Check if email exists
    existing = await db.tenants.find_one({"email": tenant.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    tenant_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Create tenant
    tenant_doc = {
        "id": tenant_id,
        "name": tenant.name,
        "email": tenant.email,
        "created_at": now
    }
    await db.tenants.insert_one(tenant_doc)
    
    # Create admin user
    user_doc = {
        "id": user_id,
        "tenant_id": tenant_id,
        "email": tenant.email,
        "username": tenant.name,
        "hashed_password": get_password_hash(tenant.password),
        "is_active": True,
        "is_admin": True,
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    # Generate token
    access_token = create_access_token({
        "sub": user_id,
        "tenant_id": tenant_id,
        "email": tenant.email
    })
    
    return TokenResponse(
        access_token=access_token,
        tenant_id=tenant_id,
        user_id=user_id,
        username=tenant.name
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login user"""
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", False):
        raise HTTPException(status_code=401, detail="Account disabled")
    
    access_token = create_access_token({
        "sub": user["id"],
        "tenant_id": user["tenant_id"],
        "email": user["email"]
    })
    
    return TokenResponse(
        access_token=access_token,
        tenant_id=user["tenant_id"],
        user_id=user["id"],
        username=user["username"]
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: TokenData = Depends(get_current_user)):
    """Get current user info"""
    user = await db.users.find_one(
        {"id": current_user.user_id, "tenant_id": current_user.tenant_id},
        {"_id": 0, "hashed_password": 0}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

# ============= USER MANAGEMENT =============

@api_router.get("/users", response_model=List[UserResponse])
async def get_tenant_users(current_user: TokenData = Depends(get_current_user)):
    """Get all users for current tenant"""
    users = await db.users.find(
        {"tenant_id": current_user.tenant_id},
        {"_id": 0, "hashed_password": 0}
    ).to_list(100)
    return [UserResponse(**u) for u in users]

@api_router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, current_user: TokenData = Depends(get_current_user)):
    """Create new user for tenant (max 2 users)"""
    # Check user count
    count = await db.users.count_documents({"tenant_id": current_user.tenant_id})
    if count >= 2:
        raise HTTPException(status_code=400, detail="Maximum 2 users per tenant allowed")
    
    # Check email exists
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "tenant_id": current_user.tenant_id,
        "email": user.email,
        "username": user.username,
        "hashed_password": get_password_hash(user.password),
        "is_active": True,
        "is_admin": False,
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    return UserResponse(
        id=user_id,
        tenant_id=current_user.tenant_id,
        email=user.email,
        username=user.username,
        is_active=True,
        created_at=now
    )

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: TokenData = Depends(get_current_user)):
    """Delete user (cannot delete self)"""
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({
        "id": user_id,
        "tenant_id": current_user.tenant_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted"}

# ============= CALENDAR ENDPOINTS =============

@api_router.get("/calendars", response_model=List[CalendarCredentialResponse])
async def get_calendar_connections(current_user: TokenData = Depends(get_current_user)):
    """Get all calendar connections for tenant"""
    creds = await db.calendar_credentials.find(
        {"tenant_id": current_user.tenant_id},
        {"_id": 0, "access_token": 0, "refresh_token": 0}
    ).to_list(100)
    return [CalendarCredentialResponse(
        id=c.get("id", ""),
        tenant_id=c["tenant_id"],
        provider=c["provider"],
        email=c["email"],
        connected_at=c.get("created_at", "")
    ) for c in creds]

@api_router.post("/calendars", response_model=CalendarCredentialResponse)
async def add_calendar_connection(cred: CalendarCredentialCreate, current_user: TokenData = Depends(get_current_user)):
    """Add calendar connection"""
    cred_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    cred_doc = {
        "id": cred_id,
        "tenant_id": current_user.tenant_id,
        "provider": cred.provider,
        "access_token": cred.access_token,
        "refresh_token": cred.refresh_token,
        "expires_at": cred.expires_at,
        "email": cred.email,
        "created_at": now
    }
    await db.calendar_credentials.insert_one(cred_doc)
    
    return CalendarCredentialResponse(
        id=cred_id,
        tenant_id=current_user.tenant_id,
        provider=cred.provider,
        email=cred.email,
        connected_at=now
    )

@api_router.delete("/calendars/{calendar_id}")
async def remove_calendar_connection(calendar_id: str, current_user: TokenData = Depends(get_current_user)):
    """Remove calendar connection"""
    result = await db.calendar_credentials.delete_one({
        "id": calendar_id,
        "tenant_id": current_user.tenant_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    return {"message": "Calendar disconnected"}

# ============= APPOINTMENT ENDPOINTS =============

@api_router.get("/appointments", response_model=List[AppointmentResponse])
async def get_appointments(current_user: TokenData = Depends(get_current_user)):
    """Get all appointments for tenant"""
    appointments = await db.appointments.find(
        {"tenant_id": current_user.tenant_id},
        {"_id": 0}
    ).sort("start_time", 1).to_list(100)
    return [AppointmentResponse(**a) for a in appointments]

@api_router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(apt: AppointmentCreate, current_user: TokenData = Depends(get_current_user)):
    """Create new appointment"""
    apt_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    apt_doc = {
        "id": apt_id,
        "tenant_id": current_user.tenant_id,
        "user_id": current_user.user_id,
        "title": apt.title,
        "start_time": apt.start_time,
        "end_time": apt.end_time,
        "description": apt.description,
        "calendar_provider": apt.calendar_provider,
        "created_at": now
    }
    await db.appointments.insert_one(apt_doc)
    
    return AppointmentResponse(**apt_doc)

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, current_user: TokenData = Depends(get_current_user)):
    """Delete appointment"""
    result = await db.appointments.delete_one({
        "id": appointment_id,
        "tenant_id": current_user.tenant_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return {"message": "Appointment deleted"}

# ============= VOICE AGENT ENDPOINTS =============

async def transcribe_audio_whisper(audio_bytes: bytes) -> str:
    """Transcribe audio using OpenAI Whisper via Emergent"""
    try:
        from emergentintegrations.llm.openai import transcribe_audio
        
        # Save bytes to temp file
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            temp_path = f.name
        
        result = await transcribe_audio(
            emergent_api_key=EMERGENT_LLM_KEY,
            audio_file_path=temp_path
        )
        
        # Cleanup temp file
        os.unlink(temp_path)
        
        return result if result else ""
    except Exception as e:
        logger.error(f"Whisper transcription error: {e}")
        return ""

async def generate_ai_response(transcription: str, calendar_context: str) -> dict:
    """Generate AI response using GPT via Emergent"""
    try:
        from emergentintegrations.llm.openai import chat_completion, Message
        
        system_prompt = f"""Du bist ein hilfreicher Sprachassistent für Kalender- und Terminverwaltung.
Du antwortest auf Deutsch.

Kalender-Kontext:
{calendar_context}

Wenn der Benutzer nach:
- Verfügbarkeit fragt: Überprüfe den Kalender-Kontext und schlage freie Zeitfenster vor
- Termine erstellen möchte: Extrahiere die Details (Titel, Zeit, Dauer) und gib an, dass ein Termin erstellt werden soll
- Kalender-Infos fragt: Gib die Informationen aus dem Kalender-Kontext

Antworte natürlich und kurz, da dies eine Sprachausgabe ist."""

        messages = [
            Message(role="system", content=system_prompt),
            Message(role="user", content=transcription)
        ]
        
        response = await chat_completion(
            emergent_api_key=EMERGENT_LLM_KEY,
            model="gpt-4o",
            messages=messages
        )
        
        return {
            "success": True,
            "response": response,
            "calendar_action": None
        }
    except Exception as e:
        logger.error(f"GPT response error: {e}")
        return {
            "success": False,
            "response": "Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten.",
            "calendar_action": None
        }

async def generate_tts_audio(text: str) -> Optional[str]:
    """Generate TTS audio using OpenAI via Emergent"""
    try:
        from emergentintegrations.llm.openai import text_to_speech
        import tempfile
        
        # Generate audio file
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            audio_path = f.name
        
        await text_to_speech(
            emergent_api_key=EMERGENT_LLM_KEY,
            text=text,
            output_file_path=audio_path,
            voice="nova"
        )
        
        # Read and encode as base64
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()
        
        os.unlink(audio_path)
        
        return base64.b64encode(audio_bytes).decode('utf-8')
    except Exception as e:
        logger.error(f"TTS error: {e}")
        return None

async def get_calendar_context(tenant_id: str) -> str:
    """Get calendar context for AI"""
    appointments = await db.appointments.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("start_time", 1).to_list(10)
    
    if not appointments:
        return "Keine anstehenden Termine gefunden."
    
    context = "Anstehende Termine:\n"
    for apt in appointments:
        context += f"- {apt['title']} am {apt['start_time']} ({apt['calendar_provider']})\n"
    
    return context

@api_router.post("/voice/transcribe")
async def transcribe_voice(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_user)
):
    """Transcribe uploaded audio file"""
    contents = await file.read()
    transcription = await transcribe_audio_whisper(contents)
    
    if not transcription:
        raise HTTPException(status_code=400, detail="Could not transcribe audio")
    
    return {"transcription": transcription}

@api_router.post("/voice/process", response_model=VoiceProcessResponse)
async def process_voice(
    request: VoiceProcessRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """Process voice input and generate response"""
    # Get calendar context
    calendar_context = await get_calendar_context(current_user.tenant_id)
    
    # Generate AI response
    ai_result = await generate_ai_response(request.transcription, calendar_context)
    
    # Generate TTS audio
    audio_base64 = await generate_tts_audio(ai_result["response"])
    
    # Store conversation
    conv_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    conv_doc = {
        "id": conv_id,
        "tenant_id": current_user.tenant_id,
        "user_id": current_user.user_id,
        "transcription": request.transcription,
        "agent_response": ai_result["response"],
        "calendar_action": ai_result.get("calendar_action"),
        "created_at": now
    }
    await db.conversations.insert_one(conv_doc)
    
    return VoiceProcessResponse(
        transcription=request.transcription,
        response=ai_result["response"],
        audio_base64=audio_base64,
        calendar_action=ai_result.get("calendar_action")
    )

@api_router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(current_user: TokenData = Depends(get_current_user)):
    """Get conversation history"""
    convs = await db.conversations.find(
        {"tenant_id": current_user.tenant_id},
        {"_id": 0, "audio_response_url": 0, "calendar_action": 0}
    ).sort("created_at", -1).to_list(50)
    return [ConversationResponse(**c) for c in convs]

# ============= TENANT SETTINGS =============

@api_router.get("/tenant")
async def get_tenant_info(current_user: TokenData = Depends(get_current_user)):
    """Get tenant info"""
    tenant = await db.tenants.find_one(
        {"id": current_user.tenant_id},
        {"_id": 0}
    )
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@api_router.put("/tenant")
async def update_tenant(
    name: str,
    current_user: TokenData = Depends(get_current_user)
):
    """Update tenant name"""
    await db.tenants.update_one(
        {"id": current_user.tenant_id},
        {"$set": {"name": name}}
    )
    return {"message": "Tenant updated"}

# ============= DASHBOARD STATS =============

@api_router.get("/stats")
async def get_dashboard_stats(current_user: TokenData = Depends(get_current_user)):
    """Get dashboard statistics"""
    appointments_count = await db.appointments.count_documents({"tenant_id": current_user.tenant_id})
    conversations_count = await db.conversations.count_documents({"tenant_id": current_user.tenant_id})
    users_count = await db.users.count_documents({"tenant_id": current_user.tenant_id})
    calendars_count = await db.calendar_credentials.count_documents({"tenant_id": current_user.tenant_id})
    
    return {
        "appointments": appointments_count,
        "conversations": conversations_count,
        "users": users_count,
        "calendars": calendars_count
    }

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Voice Agent API", "version": "1.0.0"}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
