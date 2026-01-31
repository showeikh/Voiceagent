from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status, Request, BackgroundTasks
from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse
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
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ['SECRET_KEY']
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# API Keys
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')
SIPGATE_API_TOKEN = os.environ.get('SIPGATE_API_TOKEN', '')
LEXOFFICE_API_KEY = os.environ.get('LEXOFFICE_API_KEY', '')

# Create the main app
app = FastAPI(title="Voice Agent SaaS Platform")

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============= ENUMS =============

class TenantStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    CREATED = "created"
    SENT = "sent"
    PAID = "paid"
    CANCELLED = "cancelled"

# ============= MODELS =============

# Tenant Registration with Company Details
class TenantCreate(BaseModel):
    company_name: str
    contact_person: str
    email: EmailStr
    password: str
    phone: str
    # Company Address
    street: str
    house_number: str
    postal_code: str
    city: str
    country: str = "Deutschland"
    # Tax Information
    tax_number: Optional[str] = None
    vat_id: Optional[str] = None  # USt-IdNr.
    # Additional Info
    website: Optional[str] = None
    industry: Optional[str] = None

class TenantResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    company_name: str
    contact_person: str
    email: str
    phone: str
    street: str
    house_number: str
    postal_code: str
    city: str
    country: str
    tax_number: Optional[str] = None
    vat_id: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    status: str
    created_at: str
    approved_at: Optional[str] = None

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
    is_admin: bool = False
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
    is_super_admin: bool = False
    tenant_status: str = "approved"

class TokenData(BaseModel):
    user_id: str
    tenant_id: str
    email: str
    is_super_admin: bool = False

# Pricing Models
class PricingPlanCreate(BaseModel):
    name: str
    price_per_minute: float
    monthly_fee: float = 0
    included_minutes: int = 0
    description: Optional[str] = None
    is_active: bool = True

class PricingPlanResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    price_per_minute: float
    monthly_fee: float
    included_minutes: int
    description: Optional[str] = None
    is_active: bool
    created_at: str

class MinutePackageCreate(BaseModel):
    name: str
    minutes: int
    price: float
    is_active: bool = True

class MinutePackageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    minutes: int
    price: float
    is_active: bool
    created_at: str

# Usage Tracking
class UsageRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    tenant_id: str
    call_type: str
    duration_seconds: int
    provider: str
    cost: float
    timestamp: str

# Invoice Models
class InvoiceCreate(BaseModel):
    tenant_id: str
    period_start: str
    period_end: str

class InvoiceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    tenant_id: str
    invoice_number: str
    total_minutes: float
    total_amount: float
    tax_amount: float
    gross_amount: float
    period_start: str
    period_end: str
    status: str
    lexoffice_id: Optional[str] = None
    created_at: str
    sent_at: Optional[str] = None

# Calendar & Appointment Models (existing)
class CalendarCredentialCreate(BaseModel):
    provider: str
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
    duration_seconds: int = 0
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
        is_super_admin = payload.get("is_super_admin", False)
        if not user_id or not tenant_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return TokenData(user_id=user_id, tenant_id=tenant_id, email=email, is_super_admin=is_super_admin)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_super_admin(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    if not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user

async def require_approved_tenant(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    if current_user.is_super_admin:
        return current_user
    tenant = await db.tenants.find_one({"id": current_user.tenant_id}, {"_id": 0})
    if not tenant or tenant.get("status") != TenantStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Tenant not approved. Please wait for approval.")
    return current_user

# ============= SUPER ADMIN SETUP =============

async def ensure_super_admin():
    """Create super admin if not exists"""
    super_admin = await db.super_admins.find_one({"email": "admin@voiceagent.de"})
    if not super_admin:
        admin_id = str(uuid.uuid4())
        await db.super_admins.insert_one({
            "id": admin_id,
            "email": "admin@voiceagent.de",
            "username": "Super Admin",
            "hashed_password": get_password_hash("admin123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Super Admin created: admin@voiceagent.de / admin123")

@app.on_event("startup")
async def startup_event():
    await ensure_super_admin()
    # Create default pricing plans
    existing_plans = await db.pricing_plans.count_documents({})
    if existing_plans == 0:
        default_plans = [
            {"id": str(uuid.uuid4()), "name": "Pay-per-Use", "price_per_minute": 0.15, "monthly_fee": 0, "included_minutes": 0, "description": "Bezahlen Sie nur was Sie nutzen", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Starter", "price_per_minute": 0.12, "monthly_fee": 29.00, "included_minutes": 100, "description": "100 Minuten inklusive", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Professional", "price_per_minute": 0.10, "monthly_fee": 99.00, "included_minutes": 500, "description": "500 Minuten inklusive", "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.pricing_plans.insert_many(default_plans)
        logger.info("Default pricing plans created")
    
    # Create default minute packages
    existing_packages = await db.minute_packages.count_documents({})
    if existing_packages == 0:
        default_packages = [
            {"id": str(uuid.uuid4()), "name": "100 Minuten", "minutes": 100, "price": 12.00, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "500 Minuten", "minutes": 500, "price": 50.00, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "1000 Minuten", "minutes": 1000, "price": 90.00, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.minute_packages.insert_many(default_packages)
        logger.info("Default minute packages created")

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=dict)
async def register_tenant(tenant: TenantCreate):
    """Register a new tenant (requires manual approval)"""
    # Check if email exists
    existing = await db.tenants.find_one({"email": tenant.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    tenant_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Create tenant with PENDING status
    tenant_doc = {
        "id": tenant_id,
        "company_name": tenant.company_name,
        "contact_person": tenant.contact_person,
        "email": tenant.email,
        "phone": tenant.phone,
        "street": tenant.street,
        "house_number": tenant.house_number,
        "postal_code": tenant.postal_code,
        "city": tenant.city,
        "country": tenant.country,
        "tax_number": tenant.tax_number,
        "vat_id": tenant.vat_id,
        "website": tenant.website,
        "industry": tenant.industry,
        "status": TenantStatus.PENDING,
        "pricing_plan_id": None,
        "minutes_balance": 0,
        "lexoffice_contact_id": None,
        "created_at": now,
        "approved_at": None
    }
    await db.tenants.insert_one(tenant_doc)
    
    # Create admin user
    user_doc = {
        "id": user_id,
        "tenant_id": tenant_id,
        "email": tenant.email,
        "username": tenant.contact_person,
        "hashed_password": get_password_hash(tenant.password),
        "is_active": True,
        "is_admin": True,
        "created_at": now
    }
    await db.users.insert_one(user_doc)
    
    return {
        "message": "Registrierung erfolgreich! Ihr Konto wird geprüft und nach manueller Freischaltung können Sie sich anmelden.",
        "tenant_id": tenant_id,
        "status": TenantStatus.PENDING
    }

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login user (checks tenant approval status)"""
    # First check if super admin
    super_admin = await db.super_admins.find_one({"email": request.email}, {"_id": 0})
    if super_admin and verify_password(request.password, super_admin["hashed_password"]):
        access_token = create_access_token({
            "sub": super_admin["id"],
            "tenant_id": "super_admin",
            "email": super_admin["email"],
            "is_super_admin": True
        })
        return TokenResponse(
            access_token=access_token,
            tenant_id="super_admin",
            user_id=super_admin["id"],
            username=super_admin["username"],
            is_super_admin=True,
            tenant_status="approved"
        )
    
    # Regular user login
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", False):
        raise HTTPException(status_code=401, detail="Account disabled")
    
    # Check tenant status
    tenant = await db.tenants.find_one({"id": user["tenant_id"]}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=401, detail="Tenant not found")
    
    tenant_status = tenant.get("status", TenantStatus.PENDING)
    
    access_token = create_access_token({
        "sub": user["id"],
        "tenant_id": user["tenant_id"],
        "email": user["email"],
        "is_super_admin": False
    })
    
    return TokenResponse(
        access_token=access_token,
        tenant_id=user["tenant_id"],
        user_id=user["id"],
        username=user["username"],
        is_super_admin=False,
        tenant_status=tenant_status
    )

@api_router.get("/auth/me")
async def get_current_user_info(current_user: TokenData = Depends(get_current_user)):
    """Get current user info"""
    if current_user.is_super_admin:
        admin = await db.super_admins.find_one({"id": current_user.user_id}, {"_id": 0, "hashed_password": 0})
        return {**admin, "is_super_admin": True, "tenant_status": "approved"}
    
    user = await db.users.find_one(
        {"id": current_user.user_id, "tenant_id": current_user.tenant_id},
        {"_id": 0, "hashed_password": 0}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    tenant = await db.tenants.find_one({"id": current_user.tenant_id}, {"_id": 0})
    return {**user, "is_super_admin": False, "tenant_status": tenant.get("status", "pending")}

# ============= SUPER ADMIN ENDPOINTS =============

@api_router.get("/admin/tenants", response_model=List[TenantResponse])
async def get_all_tenants(
    status: Optional[str] = None,
    current_user: TokenData = Depends(require_super_admin)
):
    """Get all tenants (Super Admin only)"""
    query = {}
    if status:
        query["status"] = status
    
    tenants = await db.tenants.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [TenantResponse(**t) for t in tenants]

@api_router.post("/admin/tenants/{tenant_id}/approve")
async def approve_tenant(tenant_id: str, current_user: TokenData = Depends(require_super_admin)):
    """Approve a pending tenant"""
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.tenants.update_one(
        {"id": tenant_id},
        {"$set": {"status": TenantStatus.APPROVED, "approved_at": now}}
    )
    
    return {"message": "Tenant approved successfully", "tenant_id": tenant_id}

@api_router.post("/admin/tenants/{tenant_id}/reject")
async def reject_tenant(tenant_id: str, reason: str = "", current_user: TokenData = Depends(require_super_admin)):
    """Reject a pending tenant"""
    await db.tenants.update_one(
        {"id": tenant_id},
        {"$set": {"status": TenantStatus.REJECTED, "rejection_reason": reason}}
    )
    return {"message": "Tenant rejected", "tenant_id": tenant_id}

@api_router.post("/admin/tenants/{tenant_id}/suspend")
async def suspend_tenant(tenant_id: str, current_user: TokenData = Depends(require_super_admin)):
    """Suspend a tenant"""
    await db.tenants.update_one(
        {"id": tenant_id},
        {"$set": {"status": TenantStatus.SUSPENDED}}
    )
    return {"message": "Tenant suspended", "tenant_id": tenant_id}

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: TokenData = Depends(require_super_admin)):
    """Get platform statistics"""
    total_tenants = await db.tenants.count_documents({})
    pending_tenants = await db.tenants.count_documents({"status": TenantStatus.PENDING})
    approved_tenants = await db.tenants.count_documents({"status": TenantStatus.APPROVED})
    total_users = await db.users.count_documents({})
    total_calls = await db.conversations.count_documents({})
    total_invoices = await db.invoices.count_documents({})
    
    # Calculate total revenue
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$gross_amount"}}}]
    revenue_result = await db.invoices.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Calculate total minutes used
    minutes_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$duration_seconds"}}}]
    minutes_result = await db.usage_records.aggregate(minutes_pipeline).to_list(1)
    total_minutes = (minutes_result[0]["total"] / 60) if minutes_result else 0
    
    return {
        "total_tenants": total_tenants,
        "pending_tenants": pending_tenants,
        "approved_tenants": approved_tenants,
        "total_users": total_users,
        "total_calls": total_calls,
        "total_invoices": total_invoices,
        "total_revenue": round(total_revenue, 2),
        "total_minutes": round(total_minutes, 2)
    }

# ============= PRICING MANAGEMENT (Admin) =============

@api_router.get("/admin/pricing-plans", response_model=List[PricingPlanResponse])
async def get_pricing_plans(current_user: TokenData = Depends(require_super_admin)):
    """Get all pricing plans"""
    plans = await db.pricing_plans.find({}, {"_id": 0}).to_list(100)
    return [PricingPlanResponse(**p) for p in plans]

@api_router.post("/admin/pricing-plans", response_model=PricingPlanResponse)
async def create_pricing_plan(plan: PricingPlanCreate, current_user: TokenData = Depends(require_super_admin)):
    """Create new pricing plan"""
    plan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    plan_doc = {
        "id": plan_id,
        **plan.model_dump(),
        "created_at": now
    }
    await db.pricing_plans.insert_one(plan_doc)
    return PricingPlanResponse(**plan_doc)

@api_router.put("/admin/pricing-plans/{plan_id}", response_model=PricingPlanResponse)
async def update_pricing_plan(plan_id: str, plan: PricingPlanCreate, current_user: TokenData = Depends(require_super_admin)):
    """Update pricing plan"""
    await db.pricing_plans.update_one(
        {"id": plan_id},
        {"$set": plan.model_dump()}
    )
    updated = await db.pricing_plans.find_one({"id": plan_id}, {"_id": 0})
    return PricingPlanResponse(**updated)

@api_router.delete("/admin/pricing-plans/{plan_id}")
async def delete_pricing_plan(plan_id: str, current_user: TokenData = Depends(require_super_admin)):
    """Delete pricing plan"""
    await db.pricing_plans.delete_one({"id": plan_id})
    return {"message": "Plan deleted"}

@api_router.get("/admin/minute-packages", response_model=List[MinutePackageResponse])
async def get_minute_packages(current_user: TokenData = Depends(require_super_admin)):
    """Get all minute packages"""
    packages = await db.minute_packages.find({}, {"_id": 0}).to_list(100)
    return [MinutePackageResponse(**p) for p in packages]

@api_router.post("/admin/minute-packages", response_model=MinutePackageResponse)
async def create_minute_package(package: MinutePackageCreate, current_user: TokenData = Depends(require_super_admin)):
    """Create new minute package"""
    package_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    package_doc = {
        "id": package_id,
        **package.model_dump(),
        "created_at": now
    }
    await db.minute_packages.insert_one(package_doc)
    return MinutePackageResponse(**package_doc)

@api_router.put("/admin/minute-packages/{package_id}", response_model=MinutePackageResponse)
async def update_minute_package(package_id: str, package: MinutePackageCreate, current_user: TokenData = Depends(require_super_admin)):
    """Update minute package"""
    await db.minute_packages.update_one(
        {"id": package_id},
        {"$set": package.model_dump()}
    )
    updated = await db.minute_packages.find_one({"id": package_id}, {"_id": 0})
    return MinutePackageResponse(**updated)

# ============= INVOICE MANAGEMENT (Admin) =============

@api_router.get("/admin/invoices", response_model=List[InvoiceResponse])
async def get_all_invoices(
    status: Optional[str] = None,
    current_user: TokenData = Depends(require_super_admin)
):
    """Get all invoices"""
    query = {}
    if status:
        query["status"] = status
    
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [InvoiceResponse(**i) for i in invoices]

@api_router.post("/admin/invoices/generate/{tenant_id}", response_model=InvoiceResponse)
async def generate_invoice(
    tenant_id: str,
    period_start: str,
    period_end: str,
    current_user: TokenData = Depends(require_super_admin)
):
    """Generate invoice for a tenant"""
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get usage records for period
    usage_records = await db.usage_records.find({
        "tenant_id": tenant_id,
        "timestamp": {"$gte": period_start, "$lte": period_end}
    }, {"_id": 0}).to_list(10000)
    
    total_seconds = sum([r.get("duration_seconds", 0) for r in usage_records])
    total_minutes = total_seconds / 60
    
    # Get pricing plan
    plan = None
    if tenant.get("pricing_plan_id"):
        plan = await db.pricing_plans.find_one({"id": tenant["pricing_plan_id"]}, {"_id": 0})
    
    # Calculate cost
    price_per_minute = plan.get("price_per_minute", 0.15) if plan else 0.15
    monthly_fee = plan.get("monthly_fee", 0) if plan else 0
    included_minutes = plan.get("included_minutes", 0) if plan else 0
    
    billable_minutes = max(0, total_minutes - included_minutes)
    usage_cost = billable_minutes * price_per_minute
    total_amount = monthly_fee + usage_cost
    tax_rate = 0.19  # 19% MwSt
    tax_amount = total_amount * tax_rate
    gross_amount = total_amount + tax_amount
    
    # Generate invoice number
    invoice_count = await db.invoices.count_documents({})
    invoice_number = f"VA-{datetime.now().year}-{invoice_count + 1:05d}"
    
    invoice_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    invoice_doc = {
        "id": invoice_id,
        "tenant_id": tenant_id,
        "invoice_number": invoice_number,
        "total_minutes": round(total_minutes, 2),
        "billable_minutes": round(billable_minutes, 2),
        "price_per_minute": price_per_minute,
        "monthly_fee": monthly_fee,
        "total_amount": round(total_amount, 2),
        "tax_rate": tax_rate,
        "tax_amount": round(tax_amount, 2),
        "gross_amount": round(gross_amount, 2),
        "period_start": period_start,
        "period_end": period_end,
        "status": InvoiceStatus.CREATED,
        "lexoffice_id": None,
        "created_at": now,
        "sent_at": None
    }
    await db.invoices.insert_one(invoice_doc)
    
    return InvoiceResponse(**invoice_doc)

@api_router.post("/admin/invoices/{invoice_id}/send-lexoffice")
async def send_invoice_to_lexoffice(invoice_id: str, current_user: TokenData = Depends(require_super_admin)):
    """Send invoice to Lexoffice and email to customer"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    tenant = await db.tenants.find_one({"id": invoice["tenant_id"]}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if not LEXOFFICE_API_KEY:
        raise HTTPException(status_code=400, detail="Lexoffice API key not configured")
    
    # Create/update contact in Lexoffice
    async with httpx.AsyncClient() as client:
        # Check if contact exists, otherwise create
        if not tenant.get("lexoffice_contact_id"):
            contact_payload = {
                "version": 0,
                "roles": {"customer": {}},
                "company": {
                    "name": tenant["company_name"],
                    "taxNumber": tenant.get("tax_number"),
                    "vatRegistrationId": tenant.get("vat_id"),
                    "contactPersons": [{
                        "firstName": tenant["contact_person"].split()[0] if " " in tenant["contact_person"] else tenant["contact_person"],
                        "lastName": tenant["contact_person"].split()[-1] if " " in tenant["contact_person"] else "",
                        "emailAddress": tenant["email"],
                        "phoneNumber": tenant["phone"]
                    }]
                },
                "addresses": {
                    "billing": [{
                        "street": f"{tenant['street']} {tenant['house_number']}",
                        "zip": tenant["postal_code"],
                        "city": tenant["city"],
                        "countryCode": "DE"
                    }]
                },
                "emailAddresses": {"business": [tenant["email"]]}
            }
            
            contact_response = await client.post(
                "https://api.lexoffice.io/v1/contacts",
                headers={"Authorization": f"Bearer {LEXOFFICE_API_KEY}", "Content-Type": "application/json"},
                json=contact_payload
            )
            
            if contact_response.status_code in [200, 201]:
                contact_data = contact_response.json()
                await db.tenants.update_one(
                    {"id": tenant["id"]},
                    {"$set": {"lexoffice_contact_id": contact_data.get("id")}}
                )
                tenant["lexoffice_contact_id"] = contact_data.get("id")
        
        # Create invoice in Lexoffice
        invoice_payload = {
            "voucherDate": invoice["created_at"][:10],
            "address": {
                "contactId": tenant.get("lexoffice_contact_id")
            },
            "lineItems": [
                {
                    "type": "custom",
                    "name": f"Voice Agent Nutzung ({invoice['period_start'][:10]} - {invoice['period_end'][:10]})",
                    "description": f"{invoice['total_minutes']:.2f} Minuten",
                    "quantity": 1,
                    "unitName": "Stück",
                    "unitPrice": {
                        "currency": "EUR",
                        "netAmount": invoice["total_amount"],
                        "taxRatePercentage": 19
                    }
                }
            ],
            "totalPrice": {
                "currency": "EUR"
            },
            "taxConditions": {
                "taxType": "net"
            },
            "shippingConditions": {
                "shippingDate": invoice["created_at"][:10],
                "shippingType": "service"
            }
        }
        
        lexoffice_response = await client.post(
            "https://api.lexoffice.io/v1/invoices",
            headers={"Authorization": f"Bearer {LEXOFFICE_API_KEY}", "Content-Type": "application/json"},
            json=invoice_payload
        )
        
        if lexoffice_response.status_code not in [200, 201]:
            logger.error(f"Lexoffice error: {lexoffice_response.text}")
            raise HTTPException(status_code=400, detail=f"Lexoffice error: {lexoffice_response.text}")
        
        lexoffice_data = lexoffice_response.json()
        now = datetime.now(timezone.utc).isoformat()
        
        await db.invoices.update_one(
            {"id": invoice_id},
            {"$set": {
                "lexoffice_id": lexoffice_data.get("id"),
                "status": InvoiceStatus.SENT,
                "sent_at": now
            }}
        )
        
        return {"message": "Invoice sent to Lexoffice", "lexoffice_id": lexoffice_data.get("id")}

# ============= TELEPHONY SETTINGS (Admin) =============

@api_router.get("/admin/telephony-config")
async def get_telephony_config(current_user: TokenData = Depends(require_super_admin)):
    """Get telephony configuration"""
    return {
        "twilio": {
            "configured": bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN),
            "phone_number": TWILIO_PHONE_NUMBER or None
        },
        "sipgate": {
            "configured": bool(SIPGATE_API_TOKEN)
        },
        "lexoffice": {
            "configured": bool(LEXOFFICE_API_KEY)
        }
    }

@api_router.post("/admin/telephony-config")
async def update_telephony_config(
    twilio_sid: Optional[str] = None,
    twilio_token: Optional[str] = None,
    twilio_phone: Optional[str] = None,
    sipgate_token: Optional[str] = None,
    lexoffice_key: Optional[str] = None,
    current_user: TokenData = Depends(require_super_admin)
):
    """Update telephony configuration (stored in DB for flexibility)"""
    config = await db.system_config.find_one({"type": "telephony"}) or {"type": "telephony"}
    
    if twilio_sid:
        config["twilio_account_sid"] = twilio_sid
    if twilio_token:
        config["twilio_auth_token"] = twilio_token
    if twilio_phone:
        config["twilio_phone_number"] = twilio_phone
    if sipgate_token:
        config["sipgate_api_token"] = sipgate_token
    if lexoffice_key:
        config["lexoffice_api_key"] = lexoffice_key
    
    await db.system_config.update_one(
        {"type": "telephony"},
        {"$set": config},
        upsert=True
    )
    
    return {"message": "Configuration updated"}

# ============= TENANT ENDPOINTS (Approved Tenants) =============

@api_router.get("/tenant")
async def get_tenant_info(current_user: TokenData = Depends(get_current_user)):
    """Get current tenant info"""
    if current_user.is_super_admin:
        return {"is_super_admin": True}
    
    tenant = await db.tenants.find_one({"id": current_user.tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@api_router.get("/tenant/usage")
async def get_tenant_usage(current_user: TokenData = Depends(require_approved_tenant)):
    """Get current tenant usage statistics"""
    # Get current month usage
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat()
    
    usage_records = await db.usage_records.find({
        "tenant_id": current_user.tenant_id,
        "timestamp": {"$gte": month_start}
    }, {"_id": 0}).to_list(10000)
    
    total_seconds = sum([r.get("duration_seconds", 0) for r in usage_records])
    total_minutes = total_seconds / 60
    
    tenant = await db.tenants.find_one({"id": current_user.tenant_id}, {"_id": 0})
    minutes_balance = tenant.get("minutes_balance", 0)
    
    return {
        "current_month_minutes": round(total_minutes, 2),
        "minutes_balance": minutes_balance,
        "total_calls": len(usage_records)
    }

@api_router.get("/pricing-plans")
async def get_available_pricing_plans():
    """Get available pricing plans (public)"""
    plans = await db.pricing_plans.find({"is_active": True}, {"_id": 0}).to_list(100)
    return [PricingPlanResponse(**p) for p in plans]

@api_router.get("/minute-packages")
async def get_available_minute_packages():
    """Get available minute packages (public)"""
    packages = await db.minute_packages.find({"is_active": True}, {"_id": 0}).to_list(100)
    return [MinutePackageResponse(**p) for p in packages]

@api_router.post("/tenant/select-plan/{plan_id}")
async def select_pricing_plan(plan_id: str, current_user: TokenData = Depends(require_approved_tenant)):
    """Select a pricing plan"""
    plan = await db.pricing_plans.find_one({"id": plan_id, "is_active": True}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    await db.tenants.update_one(
        {"id": current_user.tenant_id},
        {"$set": {"pricing_plan_id": plan_id}}
    )
    
    return {"message": "Plan selected", "plan": plan}

@api_router.post("/tenant/buy-minutes/{package_id}")
async def buy_minute_package(package_id: str, current_user: TokenData = Depends(require_approved_tenant)):
    """Buy a minute package"""
    package = await db.minute_packages.find_one({"id": package_id, "is_active": True}, {"_id": 0})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Add minutes to balance
    await db.tenants.update_one(
        {"id": current_user.tenant_id},
        {"$inc": {"minutes_balance": package["minutes"]}}
    )
    
    # Record purchase
    purchase_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    await db.purchases.insert_one({
        "id": purchase_id,
        "tenant_id": current_user.tenant_id,
        "package_id": package_id,
        "minutes": package["minutes"],
        "price": package["price"],
        "created_at": now
    })
    
    return {"message": f"{package['minutes']} Minuten hinzugefügt", "purchase_id": purchase_id}

@api_router.get("/tenant/invoices", response_model=List[InvoiceResponse])
async def get_tenant_invoices(current_user: TokenData = Depends(require_approved_tenant)):
    """Get invoices for current tenant"""
    invoices = await db.invoices.find(
        {"tenant_id": current_user.tenant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [InvoiceResponse(**i) for i in invoices]

# ============= USER MANAGEMENT =============

@api_router.get("/users", response_model=List[UserResponse])
async def get_tenant_users(current_user: TokenData = Depends(require_approved_tenant)):
    """Get all users for current tenant"""
    users = await db.users.find(
        {"tenant_id": current_user.tenant_id},
        {"_id": 0, "hashed_password": 0}
    ).to_list(100)
    return [UserResponse(**u) for u in users]

@api_router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, current_user: TokenData = Depends(require_approved_tenant)):
    """Create new user for tenant (max 2 users)"""
    count = await db.users.count_documents({"tenant_id": current_user.tenant_id})
    if count >= 2:
        raise HTTPException(status_code=400, detail="Maximum 2 users per tenant allowed")
    
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
    
    return UserResponse(**{k: v for k, v in user_doc.items() if k != "hashed_password"})

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: TokenData = Depends(require_approved_tenant)):
    """Delete user"""
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
async def get_calendar_connections(current_user: TokenData = Depends(require_approved_tenant)):
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
async def add_calendar_connection(cred: CalendarCredentialCreate, current_user: TokenData = Depends(require_approved_tenant)):
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
async def remove_calendar_connection(calendar_id: str, current_user: TokenData = Depends(require_approved_tenant)):
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
async def get_appointments(current_user: TokenData = Depends(require_approved_tenant)):
    """Get all appointments for tenant"""
    appointments = await db.appointments.find(
        {"tenant_id": current_user.tenant_id},
        {"_id": 0}
    ).sort("start_time", 1).to_list(100)
    return [AppointmentResponse(**a) for a in appointments]

@api_router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(apt: AppointmentCreate, current_user: TokenData = Depends(require_approved_tenant)):
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
async def delete_appointment(appointment_id: str, current_user: TokenData = Depends(require_approved_tenant)):
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
        import tempfile
        
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
            f.write(audio_bytes)
            temp_path = f.name
        
        result = await transcribe_audio(
            emergent_api_key=EMERGENT_LLM_KEY,
            audio_file_path=temp_path
        )
        
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
        
        return {"success": True, "response": response, "calendar_action": None}
    except Exception as e:
        logger.error(f"GPT response error: {e}")
        return {"success": False, "response": "Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten.", "calendar_action": None}

async def generate_tts_audio(text: str) -> Optional[str]:
    """Generate TTS audio using OpenAI via Emergent"""
    try:
        from emergentintegrations.llm.openai import text_to_speech
        import tempfile
        
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            audio_path = f.name
        
        await text_to_speech(
            emergent_api_key=EMERGENT_LLM_KEY,
            text=text,
            output_file_path=audio_path,
            voice="nova"
        )
        
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

async def record_usage(tenant_id: str, user_id: str, duration_seconds: int, call_type: str = "voice_agent"):
    """Record usage for billing"""
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    plan = None
    if tenant and tenant.get("pricing_plan_id"):
        plan = await db.pricing_plans.find_one({"id": tenant["pricing_plan_id"]}, {"_id": 0})
    
    price_per_minute = plan.get("price_per_minute", 0.15) if plan else 0.15
    cost = (duration_seconds / 60) * price_per_minute
    
    usage_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    await db.usage_records.insert_one({
        "id": usage_id,
        "tenant_id": tenant_id,
        "user_id": user_id,
        "call_type": call_type,
        "duration_seconds": duration_seconds,
        "provider": "emergent",
        "cost": round(cost, 4),
        "timestamp": now
    })

@api_router.post("/voice/transcribe")
async def transcribe_voice(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(require_approved_tenant)
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
    background_tasks: BackgroundTasks,
    current_user: TokenData = Depends(require_approved_tenant)
):
    """Process voice input and generate response"""
    import time
    start_time = time.time()
    
    calendar_context = await get_calendar_context(current_user.tenant_id)
    ai_result = await generate_ai_response(request.transcription, calendar_context)
    audio_base64 = await generate_tts_audio(ai_result["response"])
    
    # Calculate duration and record usage
    duration_seconds = int(time.time() - start_time) + 5  # Add 5 seconds for audio processing
    background_tasks.add_task(record_usage, current_user.tenant_id, current_user.user_id, duration_seconds)
    
    # Store conversation
    conv_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    conv_doc = {
        "id": conv_id,
        "tenant_id": current_user.tenant_id,
        "user_id": current_user.user_id,
        "transcription": request.transcription,
        "agent_response": ai_result["response"],
        "duration_seconds": duration_seconds,
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
async def get_conversations(current_user: TokenData = Depends(require_approved_tenant)):
    """Get conversation history"""
    convs = await db.conversations.find(
        {"tenant_id": current_user.tenant_id},
        {"_id": 0, "audio_response_url": 0, "calendar_action": 0}
    ).sort("created_at", -1).to_list(50)
    return [ConversationResponse(**c) for c in convs]

# ============= DASHBOARD STATS =============

@api_router.get("/stats")
async def get_dashboard_stats(current_user: TokenData = Depends(get_current_user)):
    """Get dashboard statistics"""
    if current_user.is_super_admin:
        return await get_admin_stats(current_user)
    
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
    return {"message": "Voice Agent SaaS API", "version": "2.0.0"}

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
