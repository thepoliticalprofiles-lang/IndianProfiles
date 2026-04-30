from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import logging
import bcrypt
import jwt
import secrets
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid

# ================== SUPABASE CLIENT ==================
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ================== JWT CONFIG ==================
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "default-secret-change-in-production")

# ================== HELPERS ==================
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

# ================== AUTH DEPENDENCY ==================
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        result = supabase.table("users").select("*").eq("id", payload["sub"]).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="User not found")
        user = result.data[0]
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ================== FASTAPI APP ==================
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ================== PYDANTIC MODELS ==================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class StateCreate(BaseModel):
    name: str
    code: str = ""
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None  # JSON string of video links array

class StateResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    video_links: List[str] = []  # Parsed from video_url for frontend compatibility

class DistrictCreate(BaseModel):
    name: str
    parent_state_id: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None  # JSON string of video links array

class DistrictResponse(BaseModel):
    id: str
    name: str
    parent_state_id: Optional[str] = None
    parent_state_name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    video_links: List[str] = []  # Parsed from video_url for frontend compatibility

class ConstituencyCreate(BaseModel):
    name: str
    type: str = "Assembly"
    parent_district_id: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None  # JSON string of video links array

class ConstituencyResponse(BaseModel):
    id: str
    name: str
    type: str
    parent_district_id: Optional[str] = None
    parent_district_name: Optional[str] = None
    parent_state_id: Optional[str] = None
    parent_state_name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    video_links: List[str] = []  # Parsed from video_url for frontend compatibility

class SubRegionCreate(BaseModel):
    name: str
    type: str = "Division"
    parent_constituency_id: str
    description: Optional[str] = None
    video_url: Optional[str] = None  # JSON string of video links array

class SubRegionResponse(BaseModel):
    id: str
    name: str
    type: str
    parent_constituency_id: str
    parent_constituency_name: Optional[str] = None
    parent_district_id: Optional[str] = None
    parent_district_name: Optional[str] = None
    description: Optional[str] = None
    video_url: Optional[str] = None
    video_links: List[str] = []  # Parsed from video_url for frontend compatibility

class TimelineEvent(BaseModel):
    year: str
    role: str
    description: Optional[str] = None

class LeaderCreate(BaseModel):
    name: str
    designation: str
    level: str = "Constituency"
    state_id: Optional[str] = None
    district_id: Optional[str] = None
    constituency_id: Optional[str] = None
    sub_region_id: Optional[str] = None
    bio_summary: Optional[str] = None
    biography: Optional[str] = None
    image_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    focus_area: Optional[str] = None
    location_name: Optional[str] = None
    featured_video: Optional[str] = None  # YouTube/video URL for featured video
    career_timeline: List[TimelineEvent] = []
    gallery_photos: List[str] = []
    video_links: List[str] = []

class LeaderResponse(BaseModel):
    id: str
    name: str
    designation: str
    level: str
    state_id: Optional[str] = None
    state_name: Optional[str] = None
    district_id: Optional[str] = None
    district_name: Optional[str] = None
    constituency_id: Optional[str] = None
    constituency_name: Optional[str] = None
    sub_region_id: Optional[str] = None
    sub_region_name: Optional[str] = None
    bio_summary: Optional[str] = None
    biography: Optional[str] = None
    image_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    focus_area: Optional[str] = None
    location_name: Optional[str] = None
    featured_video: Optional[str] = None
    career_timeline: List[dict] = []
    gallery_photos: List[str] = []
    video_links: List[str] = []
    created_at: Optional[str] = None

class ArticleCreate(BaseModel):
    title: str
    content: str
    event_date: Optional[str] = None
    featured_image: Optional[str] = None
    constituency_id: Optional[str] = None
    sub_region_id: Optional[str] = None
    tagged_leader_ids: List[str] = []
    article_type: str = "development"
    status: str = "published"

class ArticleResponse(BaseModel):
    id: str
    title: str
    content: str
    event_date: Optional[str] = None
    featured_image: Optional[str] = None
    constituency_id: Optional[str] = None
    constituency_name: Optional[str] = None
    sub_region_id: Optional[str] = None
    sub_region_name: Optional[str] = None
    tagged_leader_ids: List[str] = []
    tagged_leaders: List[dict] = []
    article_type: str
    status: str
    created_at: Optional[str] = None

class GrievanceCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    constituency_id: Optional[str] = None
    sub_region_id: Optional[str] = None
    category: str
    description: str

class GrievanceResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    constituency_id: Optional[str] = None
    constituency_name: Optional[str] = None
    sub_region_id: Optional[str] = None
    sub_region_name: Optional[str] = None
    category: str
    description: str
    status: str
    admin_notes: Optional[str] = None
    created_at: Optional[str] = None

class GrievanceUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None

class VolunteerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    constituency_id: Optional[str] = None
    sub_region_id: Optional[str] = None
    skills: List[str] = []
    availability: Optional[str] = None

class VolunteerResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    constituency_id: Optional[str] = None
    constituency_name: Optional[str] = None
    sub_region_id: Optional[str] = None
    sub_region_name: Optional[str] = None
    skills: List[str] = []
    availability: Optional[str] = None
    status: str
    created_at: Optional[str] = None

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: str
    event_time: Optional[str] = None
    location: Optional[str] = None
    constituency_id: Optional[str] = None
    sub_region_id: Optional[str] = None
    event_type: str = "public"

class EventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    event_date: str
    event_time: Optional[str] = None
    location: Optional[str] = None
    constituency_id: Optional[str] = None
    constituency_name: Optional[str] = None
    sub_region_id: Optional[str] = None
    sub_region_name: Optional[str] = None
    event_type: str
    created_at: Optional[str] = None

# ================== AUTH ENDPOINTS ==================

@api_router.get("/")
async def root():
    return {"message": "Indian Profiles API"}

@api_router.post("/auth/register")
async def register(data: UserRegister, response: Response):
    email = data.email.lower()
    existing = supabase.table("users").select("id").eq("email", email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(data.password)
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hashed,
        "name": data.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("users").insert(user_doc).execute()

    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

    return {"id": user_id, "email": email, "name": data.name, "role": "user"}

@api_router.post("/auth/login")
async def login(data: UserLogin, response: Response, request: Request):
    email = data.email.lower()
    client_ip = request.client.host if request.client else "unknown"
    identifier = f"{client_ip}:{email}"

    # Brute-force check
    attempt_res = supabase.table("login_attempts").select("*").eq("identifier", identifier).execute()
    if attempt_res.data:
        attempt = attempt_res.data[0]
        if attempt.get("count", 0) >= 5:
            locked_until = attempt.get("locked_until")
            if locked_until:
                locked_dt = datetime.fromisoformat(locked_until.replace("Z", "+00:00"))
                if locked_dt > datetime.now(timezone.utc):
                    raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    user_res = supabase.table("users").select("*").eq("email", email).execute()
    if not user_res.data or not verify_password(data.password, user_res.data[0]["password_hash"]):
        locked_until = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        if attempt_res.data:
            supabase.table("login_attempts").update({
                "count": attempt_res.data[0].get("count", 0) + 1,
                "locked_until": locked_until
            }).eq("identifier", identifier).execute()
        else:
            supabase.table("login_attempts").insert({
                "identifier": identifier, "count": 1, "locked_until": locked_until
            }).execute()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    supabase.table("login_attempts").delete().eq("identifier", identifier).execute()

    user = user_res.data[0]
    user_id = user["id"]
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

    return {"id": user_id, "email": user["email"], "name": user["name"], "role": user["role"]}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}

@api_router.post("/auth/refresh")
async def refresh_token_endpoint(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        result = supabase.table("users").select("*").eq("id", payload["sub"]).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="User not found")
        user = result.data[0]
        access_token = create_access_token(user["id"], user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ================== GEOGRAPHY ==================

def _get_state_name(state_id: Optional[str]) -> Optional[str]:
    if not state_id:
        return None
    res = supabase.table("states").select("name").eq("id", state_id).execute()
    return res.data[0]["name"] if res.data else None

def _get_district_name(district_id: Optional[str]) -> Optional[str]:
    if not district_id:
        return None
    res = supabase.table("districts").select("name").eq("id", district_id).execute()
    return res.data[0]["name"] if res.data else None

def _get_constituency_name(constituency_id: Optional[str]) -> Optional[str]:
    if not constituency_id:
        return None
    res = supabase.table("constituencies").select("name").eq("id", constituency_id).execute()
    return res.data[0]["name"] if res.data else None

def _get_sub_region_name(sub_region_id: Optional[str]) -> Optional[str]:
    if not sub_region_id:
        return None
    res = supabase.table("sub_regions").select("name").eq("id", sub_region_id).execute()
    return res.data[0]["name"] if res.data else None

@api_router.get("/geography/tree")
async def get_geography_tree():
    states = supabase.table("states").select("*").execute().data or []
    for state in states:
        districts = supabase.table("districts").select("*").eq("parent_state_id", state["id"]).execute().data or []
        for district in districts:
            constituencies = supabase.table("constituencies").select("*").eq("parent_district_id", district["id"]).execute().data or []
            for const in constituencies:
                sub_regions = supabase.table("sub_regions").select("*").eq("parent_constituency_id", const["id"]).execute().data or []
                const["sub_regions"] = sub_regions
            district["constituencies"] = constituencies
        state["districts"] = districts
    return states

# Helper function to parse video_url JSON to video_links array
def _parse_video_links(data: dict) -> dict:
    """Parse video_url JSON string to video_links array for response"""
    if data.get("video_url"):
        try:
            import json
            video_links = json.loads(data["video_url"])
            if isinstance(video_links, list):
                data["video_links"] = video_links
            else:
                data["video_links"] = []
        except (json.JSONDecodeError, TypeError):
            # If video_url is a single URL string, wrap it in array
            if isinstance(data["video_url"], str) and data["video_url"].startswith("http"):
                data["video_links"] = [data["video_url"]]
            else:
                data["video_links"] = []
    else:
        data["video_links"] = []
    return data

# States
@api_router.get("/states", response_model=List[StateResponse])
async def get_states():
    result = supabase.table("states").select("*").execute()
    states = result.data or []
    return [_parse_video_links(s) for s in states]

@api_router.get("/states/{state_id}", response_model=StateResponse)
async def get_state(state_id: str):
    result = supabase.table("states").select("*").eq("id", state_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="State not found")
    return _parse_video_links(result.data[0])

@api_router.post("/states", response_model=StateResponse)
async def create_state(data: StateCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "code": data.code,
        "description": data.description,
        "image_url": data.image_url,
        "video_url": data.video_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    try:
        supabase.table("states").insert(doc).execute()
    except Exception as e:
        logger.error(f"Failed to create state: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    return _parse_video_links(doc)

@api_router.put("/states/{state_id}", response_model=StateResponse)
async def update_state(state_id: str, data: StateCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = supabase.table("states").select("id").eq("id", state_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="State not found")
    update_data = {
        "name": data.name,
        "code": data.code,
        "description": data.description,
        "image_url": data.image_url,
        "video_url": data.video_url,
    }
    try:
        supabase.table("states").update(update_data).eq("id", state_id).execute()
    except Exception as e:
        logger.error(f"Failed to update state: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    updated = supabase.table("states").select("*").eq("id", state_id).execute()
    return _parse_video_links(updated.data[0])

@api_router.delete("/states/{state_id}")
async def delete_state(state_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = supabase.table("states").delete().eq("id", state_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="State not found")
    return {"message": "State deleted"}

# Districts
@api_router.get("/districts", response_model=List[DistrictResponse])
async def get_districts(state_id: Optional[str] = None):
    query = supabase.table("districts").select("*")
    if state_id:
        query = query.eq("parent_state_id", state_id)
    districts = query.execute().data or []
    for d in districts:
        d["parent_state_name"] = _get_state_name(d.get("parent_state_id"))
        _parse_video_links(d)
    return districts

@api_router.get("/districts/{district_id}", response_model=DistrictResponse)
async def get_district(district_id: str):
    result = supabase.table("districts").select("*").eq("id", district_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="District not found")
    d = result.data[0]
    d["parent_state_name"] = _get_state_name(d.get("parent_state_id"))
    return _parse_video_links(d)

@api_router.post("/districts", response_model=DistrictResponse)
async def create_district(data: DistrictCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if data.parent_state_id:
        state = supabase.table("states").select("id").eq("id", data.parent_state_id).execute()
        if not state.data:
            raise HTTPException(status_code=400, detail="Parent state not found")
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "parent_state_id": data.parent_state_id,
        "description": data.description,
        "image_url": data.image_url,
        "video_url": data.video_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    try:
        supabase.table("districts").insert(doc).execute()
    except Exception as e:
        logger.error(f"Failed to create district: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    doc["parent_state_name"] = _get_state_name(data.parent_state_id)
    return _parse_video_links(doc)

@api_router.put("/districts/{district_id}", response_model=DistrictResponse)
async def update_district(district_id: str, data: DistrictCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = supabase.table("districts").select("id").eq("id", district_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="District not found")
    update_data = {
        "name": data.name,
        "parent_state_id": data.parent_state_id,
        "description": data.description,
        "image_url": data.image_url,
        "video_url": data.video_url,
    }
    try:
        supabase.table("districts").update(update_data).eq("id", district_id).execute()
    except Exception as e:
        logger.error(f"Failed to update district: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    updated = supabase.table("districts").select("*").eq("id", district_id).execute().data[0]
    updated["parent_state_name"] = _get_state_name(updated.get("parent_state_id"))
    return _parse_video_links(updated)

@api_router.delete("/districts/{district_id}")
async def delete_district(district_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = supabase.table("districts").delete().eq("id", district_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="District not found")
    return {"message": "District deleted"}

# Constituencies
@api_router.get("/constituencies", response_model=List[ConstituencyResponse])
async def get_constituencies(district_id: Optional[str] = None):
    query = supabase.table("constituencies").select("*")
    if district_id:
        query = query.eq("parent_district_id", district_id)
    constituencies = query.execute().data or []
    for c in constituencies:
        if c.get("parent_district_id"):
            district_res = supabase.table("districts").select("*").eq("id", c["parent_district_id"]).execute()
            if district_res.data:
                district = district_res.data[0]
                c["parent_district_name"] = district["name"]
                c["parent_state_id"] = district.get("parent_state_id")
                c["parent_state_name"] = _get_state_name(district.get("parent_state_id"))
        _parse_video_links(c)
    return constituencies

@api_router.get("/constituencies/{constituency_id}", response_model=ConstituencyResponse)
async def get_constituency(constituency_id: str):
    result = supabase.table("constituencies").select("*").eq("id", constituency_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Constituency not found")
    c = result.data[0]
    if c.get("parent_district_id"):
        district_res = supabase.table("districts").select("*").eq("id", c["parent_district_id"]).execute()
        if district_res.data:
            district = district_res.data[0]
            c["parent_district_name"] = district["name"]
            c["parent_state_id"] = district.get("parent_state_id")
            c["parent_state_name"] = _get_state_name(district.get("parent_state_id"))
    return _parse_video_links(c)

@api_router.post("/constituencies", response_model=ConstituencyResponse)
async def create_constituency(data: ConstituencyCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if data.parent_district_id:
        district = supabase.table("districts").select("id").eq("id", data.parent_district_id).execute()
        if not district.data:
            raise HTTPException(status_code=400, detail="Parent district not found")
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "type": data.type,
        "parent_district_id": data.parent_district_id,
        "description": data.description,
        "image_url": data.image_url,
        "video_url": data.video_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    try:
        supabase.table("constituencies").insert(doc).execute()
    except Exception as e:
        logger.error(f"Failed to create constituency: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    doc["parent_district_name"] = _get_district_name(data.parent_district_id)
    return _parse_video_links(doc)

@api_router.put("/constituencies/{constituency_id}", response_model=ConstituencyResponse)
async def update_constituency(constituency_id: str, data: ConstituencyCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = supabase.table("constituencies").select("id").eq("id", constituency_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Constituency not found")
    update_data = {
        "name": data.name,
        "type": data.type,
        "parent_district_id": data.parent_district_id,
        "description": data.description,
        "image_url": data.image_url,
        "video_url": data.video_url,
    }
    try:
        supabase.table("constituencies").update(update_data).eq("id", constituency_id).execute()
    except Exception as e:
        logger.error(f"Failed to update constituency: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    updated = supabase.table("constituencies").select("*").eq("id", constituency_id).execute().data[0]
    updated["parent_district_name"] = _get_district_name(updated.get("parent_district_id"))
    return _parse_video_links(updated)

@api_router.delete("/constituencies/{constituency_id}")
async def delete_constituency(constituency_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = supabase.table("constituencies").delete().eq("id", constituency_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Constituency not found")
    return {"message": "Constituency deleted"}

# Sub-Regions
@api_router.get("/sub-regions", response_model=List[SubRegionResponse])
async def get_sub_regions(constituency_id: Optional[str] = None):
    query = supabase.table("sub_regions").select("*")
    if constituency_id:
        query = query.eq("parent_constituency_id", constituency_id)
    sub_regions = query.execute().data or []
    for sr in sub_regions:
        sr["parent_constituency_name"] = _get_constituency_name(sr.get("parent_constituency_id"))
        if sr.get("parent_constituency_id"):
            const_res = supabase.table("constituencies").select("parent_district_id").eq("id", sr["parent_constituency_id"]).execute()
            if const_res.data:
                district_id = const_res.data[0].get("parent_district_id")
                sr["parent_district_id"] = district_id
                sr["parent_district_name"] = _get_district_name(district_id)
        _parse_video_links(sr)
    return sub_regions

@api_router.get("/sub-regions/{sub_region_id}", response_model=SubRegionResponse)
async def get_sub_region(sub_region_id: str):
    result = supabase.table("sub_regions").select("*").eq("id", sub_region_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Sub-region not found")
    sr = result.data[0]
    sr["parent_constituency_name"] = _get_constituency_name(sr.get("parent_constituency_id"))
    return _parse_video_links(sr)

@api_router.post("/sub-regions", response_model=SubRegionResponse)
async def create_sub_region(data: SubRegionCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    const_res = supabase.table("constituencies").select("*").eq("id", data.parent_constituency_id).execute()
    if not const_res.data:
        raise HTTPException(status_code=400, detail="Parent constituency not found")
    doc = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "type": data.type,
        "parent_constituency_id": data.parent_constituency_id,
        "description": data.description,
        "video_url": data.video_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    try:
        supabase.table("sub_regions").insert(doc).execute()
    except Exception as e:
        logger.error(f"Failed to create sub-region: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    doc["parent_constituency_name"] = const_res.data[0]["name"]
    return _parse_video_links(doc)

@api_router.put("/sub-regions/{sub_region_id}", response_model=SubRegionResponse)
async def update_sub_region(sub_region_id: str, data: SubRegionCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = supabase.table("sub_regions").select("id").eq("id", sub_region_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Sub-region not found")
    update_data = {
        "name": data.name,
        "type": data.type,
        "parent_constituency_id": data.parent_constituency_id,
        "description": data.description,
        "video_url": data.video_url,
    }
    try:
        supabase.table("sub_regions").update(update_data).eq("id", sub_region_id).execute()
    except Exception as e:
        logger.error(f"Failed to update sub-region: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    updated = supabase.table("sub_regions").select("*").eq("id", sub_region_id).execute().data[0]
    updated["parent_constituency_name"] = _get_constituency_name(updated.get("parent_constituency_id"))
    return _parse_video_links(updated)

@api_router.delete("/sub-regions/{sub_region_id}")
async def delete_sub_region(sub_region_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = supabase.table("sub_regions").delete().eq("id", sub_region_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Sub-region not found")
    return {"message": "Sub-region deleted"}

# ================== LEADERS ==================

def _enrich_leader(leader: dict) -> dict:
    leader["state_name"] = _get_state_name(leader.get("state_id"))
    leader["district_name"] = _get_district_name(leader.get("district_id"))
    leader["constituency_name"] = _get_constituency_name(leader.get("constituency_id"))
    leader["sub_region_name"] = _get_sub_region_name(leader.get("sub_region_id"))
    return leader

@api_router.get("/leaders", response_model=List[LeaderResponse])
async def get_leaders(
    state_id: Optional[str] = None,
    district_id: Optional[str] = None,
    constituency_id: Optional[str] = None,
    sub_region_id: Optional[str] = None
):
    query = supabase.table("leaders").select("*")
    if state_id:
        query = query.eq("state_id", state_id)
    if district_id:
        query = query.eq("district_id", district_id)
    if constituency_id:
        query = query.eq("constituency_id", constituency_id)
    if sub_region_id:
        query = query.eq("sub_region_id", sub_region_id)
    leaders = query.execute().data or []
    return [_enrich_leader(l) for l in leaders]

@api_router.get("/leaders/{leader_id}", response_model=LeaderResponse)
async def get_leader(leader_id: str):
    result = supabase.table("leaders").select("*").eq("id", leader_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Leader not found")
    return _enrich_leader(result.data[0])

@api_router.post("/leaders", response_model=LeaderResponse)
async def create_leader(data: LeaderCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    # Serialize nested lists/objects to plain Python (Supabase handles JSONB)
    doc["career_timeline"] = [t.model_dump() if hasattr(t, "model_dump") else t for t in doc["career_timeline"]]
    
    # Convert empty strings to None for UUID fields (Supabase requires null, not empty string)
    uuid_fields = ["state_id", "district_id", "constituency_id", "sub_region_id"]
    for field in uuid_fields:
        if doc.get(field) == "":
            doc[field] = None
    
    supabase.table("leaders").insert(doc).execute()
    return LeaderResponse(**_enrich_leader(doc))

@api_router.put("/leaders/{leader_id}", response_model=LeaderResponse)
async def update_leader(leader_id: str, data: LeaderCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = supabase.table("leaders").select("id").eq("id", leader_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Leader not found")
    update_data = data.model_dump()
    update_data["career_timeline"] = [t.model_dump() if hasattr(t, "model_dump") else t for t in update_data["career_timeline"]]
    
    # Convert empty strings to None for UUID fields (Supabase requires null, not empty string)
    uuid_fields = ["state_id", "district_id", "constituency_id", "sub_region_id"]
    for field in uuid_fields:
        if update_data.get(field) == "":
            update_data[field] = None
    
    supabase.table("leaders").update(update_data).eq("id", leader_id).execute()
    updated = supabase.table("leaders").select("*").eq("id", leader_id).execute().data[0]
    return LeaderResponse(**_enrich_leader(updated))

@api_router.delete("/leaders/{leader_id}")
async def delete_leader(leader_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = supabase.table("leaders").delete().eq("id", leader_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Leader not found")
    return {"message": "Leader deleted"}

# ================== ARTICLES ==================

def _enrich_article(article: dict) -> dict:
    article["constituency_name"] = _get_constituency_name(article.get("constituency_id"))
    article["sub_region_name"] = _get_sub_region_name(article.get("sub_region_id"))
    tagged_leader_ids = article.get("tagged_leader_ids") or []
    tagged_leaders = []
    for lid in tagged_leader_ids:
        res = supabase.table("leaders").select("id, name, designation, image_url").eq("id", lid).execute()
        if res.data:
            tagged_leaders.append(res.data[0])
    article["tagged_leaders"] = tagged_leaders
    return article

@api_router.get("/articles", response_model=List[ArticleResponse])
async def get_articles(
    constituency_id: Optional[str] = None,
    sub_region_id: Optional[str] = None,
    leader_id: Optional[str] = None,
    article_type: Optional[str] = None,
    status: Optional[str] = None
):
    query = supabase.table("articles").select("*").order("created_at", desc=True)
    if constituency_id:
        query = query.eq("constituency_id", constituency_id)
    if sub_region_id:
        query = query.eq("sub_region_id", sub_region_id)
    if article_type:
        query = query.eq("article_type", article_type)
    if status:
        query = query.eq("status", status)
    articles = query.execute().data or []
    if leader_id:
        articles = [a for a in articles if leader_id in (a.get("tagged_leader_ids") or [])]
    return [_enrich_article(a) for a in articles]

@api_router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: str):
    result = supabase.table("articles").select("*").eq("id", article_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Article not found")
    return _enrich_article(result.data[0])

@api_router.post("/articles", response_model=ArticleResponse)
async def create_article(data: ArticleCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("articles").insert(doc).execute()
    doc["tagged_leaders"] = []
    return ArticleResponse(**doc)

@api_router.put("/articles/{article_id}", response_model=ArticleResponse)
async def update_article(article_id: str, data: ArticleCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = supabase.table("articles").select("id").eq("id", article_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Article not found")
    supabase.table("articles").update(data.model_dump()).eq("id", article_id).execute()
    updated = supabase.table("articles").select("*").eq("id", article_id).execute().data[0]
    return _enrich_article(updated)

@api_router.delete("/articles/{article_id}")
async def delete_article(article_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = supabase.table("articles").delete().eq("id", article_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"message": "Article deleted"}

# ================== GRIEVANCES ==================

def _enrich_grievance(g: dict) -> dict:
    g["constituency_name"] = _get_constituency_name(g.get("constituency_id"))
    g["sub_region_name"] = _get_sub_region_name(g.get("sub_region_id"))
    return g

@api_router.get("/grievances", response_model=List[GrievanceResponse])
async def get_grievances(
    status: Optional[str] = None,
    constituency_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    query = supabase.table("grievances").select("*").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    if constituency_id:
        query = query.eq("constituency_id", constituency_id)
    grievances = query.execute().data or []
    return [_enrich_grievance(g) for g in grievances]

@api_router.post("/grievances", response_model=GrievanceResponse)
async def create_grievance(data: GrievanceCreate):
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "pending",
        "admin_notes": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("grievances").insert(doc).execute()
    return GrievanceResponse(**doc)

@api_router.put("/grievances/{grievance_id}", response_model=GrievanceResponse)
async def update_grievance(grievance_id: str, data: GrievanceUpdate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = supabase.table("grievances").select("id").eq("id", grievance_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Grievance not found")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    supabase.table("grievances").update(update_data).eq("id", grievance_id).execute()
    updated = supabase.table("grievances").select("*").eq("id", grievance_id).execute().data[0]
    return _enrich_grievance(updated)

# ================== VOLUNTEERS ==================

def _enrich_volunteer(v: dict) -> dict:
    v["constituency_name"] = _get_constituency_name(v.get("constituency_id"))
    v["sub_region_name"] = _get_sub_region_name(v.get("sub_region_id"))
    return v

@api_router.get("/volunteers", response_model=List[VolunteerResponse])
async def get_volunteers(
    status: Optional[str] = None,
    constituency_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    query = supabase.table("volunteers").select("*").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    if constituency_id:
        query = query.eq("constituency_id", constituency_id)
    volunteers = query.execute().data or []
    return [_enrich_volunteer(v) for v in volunteers]

@api_router.post("/volunteers", response_model=VolunteerResponse)
async def create_volunteer(data: VolunteerCreate):
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("volunteers").insert(doc).execute()
    return VolunteerResponse(**doc)

@api_router.put("/volunteers/{volunteer_id}")
async def update_volunteer_status(volunteer_id: str, status: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = supabase.table("volunteers").select("id").eq("id", volunteer_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    supabase.table("volunteers").update({"status": status}).eq("id", volunteer_id).execute()
    return {"message": "Volunteer status updated"}

# ================== EVENTS ==================

def _enrich_event(e: dict) -> dict:
    e["constituency_name"] = _get_constituency_name(e.get("constituency_id"))
    e["sub_region_name"] = _get_sub_region_name(e.get("sub_region_id"))
    return e

@api_router.get("/events", response_model=List[EventResponse])
async def get_events(constituency_id: Optional[str] = None, upcoming: Optional[bool] = None):
    query = supabase.table("events").select("*").order("event_date", desc=False)
    if constituency_id:
        query = query.eq("constituency_id", constituency_id)
    if upcoming:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query = query.gte("event_date", today)
    events = query.execute().data or []
    return [_enrich_event(e) for e in events]

@api_router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    result = supabase.table("events").select("*").eq("id", event_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return _enrich_event(result.data[0])

@api_router.post("/events", response_model=EventResponse)
async def create_event(data: EventCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    doc = {
        "id": str(uuid.uuid4()),
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("events").insert(doc).execute()
    return EventResponse(**doc)

@api_router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(event_id: str, data: EventCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = supabase.table("events").select("id").eq("id", event_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Event not found")
    supabase.table("events").update(data.model_dump()).eq("id", event_id).execute()
    updated = supabase.table("events").select("*").eq("id", event_id).execute().data[0]
    return _enrich_event(updated)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = supabase.table("events").delete().eq("id", event_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted"}

# ================== GLOBAL SEARCH ==================

class SearchResult(BaseModel):
    id: str
    name: str
    type: str  # "constituency", "leader", "article", "sub_region", "event"
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    url: str

@api_router.get("/search", response_model=List[SearchResult])
async def global_search(q: str = "", limit: int = 10):
    """
    Wikipedia-style real-time search across all entities.
    Returns matching constituencies, leaders, articles, sub-regions, and events.
    """
    if not q or len(q.strip()) < 1:
        return []
    
    query_lower = q.lower().strip()
    results = []
    
    # Search Constituencies - using ilike for case-insensitive partial matching
    try:
        const_res = supabase.table("constituencies").select("*").ilike("name", f"%{query_lower}%").limit(limit).execute()
        for c in const_res.data or []:
            results.append(SearchResult(
                id=c["id"],
                name=c["name"],
                type="constituency",
                subtitle=c.get("type", "Constituency"),
                image_url=c.get("image_url"),
                url=f"/constituency/{c['id']}"
            ))
    except Exception as e:
        logger.warning(f"Constituency search error: {e}")
    
    # Search States
    try:
        state_res = supabase.table("states").select("*").ilike("name", f"%{query_lower}%").limit(limit).execute()
        for s in state_res.data or []:
            results.append(SearchResult(
                id=s["id"],
                name=s["name"],
                type="state",
                subtitle=s.get("code", "State"),
                image_url=s.get("image_url"),
                url=f"/state/{s['id']}"
            ))
    except Exception as e:
        logger.warning(f"State search error: {e}")
    
    # Search Districts
    try:
        district_res = supabase.table("districts").select("*").ilike("name", f"%{query_lower}%").limit(limit).execute()
        for d in district_res.data or []:
            results.append(SearchResult(
                id=d["id"],
                name=d["name"],
                type="district",
                subtitle=d.get("parent_state_name", "District"),
                image_url=d.get("image_url"),
                url=f"/district/{d['id']}"
            ))
    except Exception as e:
        logger.warning(f"District search error: {e}")
    
    # Search Sub-Regions / Divisions
    try:
        sr_res = supabase.table("sub_regions").select("*").ilike("name", f"%{query_lower}%").limit(limit).execute()
        for sr in sr_res.data or []:
            results.append(SearchResult(
                id=sr["id"],
                name=sr["name"],
                type="sub_region",
                subtitle=sr.get("type", "Division"),
                image_url=None,
                url=f"/division/{sr['id']}"
            ))
    except Exception as e:
        logger.warning(f"Sub-region search error: {e}")
    
    # Search Leaders
    try:
        leader_res = supabase.table("leaders").select("*").ilike("name", f"%{query_lower}%").limit(limit).execute()
        for l in leader_res.data or []:
            results.append(SearchResult(
                id=l["id"],
                name=l["name"],
                type="leader",
                subtitle=l.get("designation"),
                image_url=l.get("image_url"),
                url=f"/leader/{l['id']}"
            ))
    except Exception as e:
        logger.warning(f"Leader search error: {e}")
    
    # Search Articles
    try:
        article_res = supabase.table("articles").select("*").ilike("title", f"%{query_lower}%").eq("status", "published").limit(limit).execute()
        for a in article_res.data or []:
            results.append(SearchResult(
                id=a["id"],
                name=a["title"],
                type="article",
                subtitle=a.get("article_type", "Article"),
                image_url=a.get("featured_image"),
                url=f"/article/{a['id']}"
            ))
    except Exception as e:
        logger.warning(f"Article search error: {e}")
    
    # Search Events
    try:
        event_res = supabase.table("events").select("*").ilike("title", f"%{query_lower}%").limit(limit).execute()
        for e in event_res.data or []:
            results.append(SearchResult(
                id=e["id"],
                name=e["title"],
                type="event",
                subtitle=e.get("event_date"),
                image_url=None,
                url=f"/event/{e['id']}"
            ))
    except Exception as e:
        logger.warning(f"Event search error: {e}")
    
    # Sort by relevance (exact matches first, then starts-with, then contains)
    def sort_key(item):
        name_lower = item.name.lower()
        if name_lower == query_lower:
            return (0, name_lower)
        elif name_lower.startswith(query_lower):
            return (1, name_lower)
        else:
            return (2, name_lower)
    
    results.sort(key=sort_key)
    return results[:limit]

# ================== STATS ==================

@api_router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    def count(table, filters=None):
        q = supabase.table(table).select("id", count="exact")
        if filters:
            for k, v in filters.items():
                q = q.eq(k, v)
        return q.execute().count or 0

    return {
        "states": count("states"),
        "districts": count("districts"),
        "constituencies": count("constituencies"),
        "sub_regions": count("sub_regions"),
        "leaders": count("leaders"),
        "articles": count("articles"),
        "grievances_pending": count("grievances", {"status": "pending"}),
        "volunteers_pending": count("volunteers", {"status": "pending"}),
        "events": count("events"),
    }

# ================== FILE UPLOAD ==================

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    content = await file.read()
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"{uuid.uuid4()}.{ext}"

    # Try uploading to Supabase Storage bucket "uploads" first
    try:
        supabase.storage.from_("uploads").upload(filename, content, {"content-type": file.content_type or "application/octet-stream"})
        public_url = supabase.storage.from_("uploads").get_public_url(filename)
        return {"url": public_url}
    except Exception:
        # Fallback: save locally
        upload_dir = ROOT_DIR / "uploads"
        upload_dir.mkdir(exist_ok=True)
        with open(upload_dir / filename, "wb") as f:
            f.write(content)
        return {"url": f"/api/uploads/{filename}"}

@api_router.get("/uploads/{filename}")
async def get_upload(filename: str):
    file_path = ROOT_DIR / "uploads" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload an image to Supabase Storage and return the public URL"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed. Allowed types: {allowed_types}")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{ext}"
    storage_path = f"uploads/{unique_filename}"
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload to Supabase Storage
        result = supabase.storage.from_("images").upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_("images").get_public_url(storage_path)
        
        logger.info(f"Image uploaded: {storage_path} by user {user['email']}")
        
        return {
            "url": public_url,
            "path": storage_path,
            "filename": file.filename,
            "size": len(file_content)
        }
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# CORS configuration - handle credentials properly
cors_origins_env = os.environ.get('CORS_ORIGINS', '*')
if cors_origins_env == '*':
    # When using credentials, we need specific origins.
    # Allow localhost + any emergentagent.com preview subdomain via regex.
    cors_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]
    cors_origin_regex = r"https://.*\.preview\.emergentagent\.com|https://.*\.emergentagent\.com"
else:
    cors_origins = [o.strip() for o in cors_origins_env.split(',')]
    cors_origin_regex = None

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_origin_regex=cors_origin_regex,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================== LOGGING ==================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ================== VOTER ANALYTICS HUB ==================

class VoterCreate(BaseModel):
    epic_number: str
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    relative_name: Optional[str] = None
    house_number: Optional[str] = None
    booth_number: Optional[str] = None
    part_number: Optional[str] = None
    address: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    state_id: Optional[str] = None
    district_id: Optional[str] = None
    constituency_id: Optional[str] = None
    sub_region_id: Optional[str] = None
    location_name: Optional[str] = None

class VoterUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    relative_name: Optional[str] = None
    house_number: Optional[str] = None
    booth_number: Optional[str] = None
    part_number: Optional[str] = None
    address: Optional[str] = None
    mobile_number: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    state_id: Optional[str] = None
    district_id: Optional[str] = None
    constituency_id: Optional[str] = None
    sub_region_id: Optional[str] = None
    location_name: Optional[str] = None

@api_router.get("/voters")
async def get_voters(
    search: Optional[str] = None,
    search_by: Optional[str] = "name",  # name, epic, booth, house, mobile, part
    state_id: Optional[str] = None,
    district_id: Optional[str] = None,
    constituency_id: Optional[str] = None,
    sub_region_id: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    user: dict = Depends(get_current_user)
):
    """Get voters with hierarchical geofencing based on user's location level"""
    # Check if user has voter hub access
    user_data = supabase.table("users").select("*").eq("id", user["id"]).execute()
    if not user_data.data:
        raise HTTPException(status_code=403, detail="User not found")
    
    user_info = user_data.data[0]
    if not user_info.get("can_access_voter_hub") and not user_info.get("is_super_admin"):
        raise HTTPException(status_code=403, detail="Access to Voter Hub denied")
    
    query = supabase.table("voters").select("*", count="exact")
    
    # Apply hierarchical geofencing for non-super admins
    if not user_info.get("is_super_admin"):
        location_level = user_info.get("location_level")
        assigned_location = user_info.get("assigned_location_id")
        
        if assigned_location and location_level:
            if location_level == "State":
                # State level users can see all voters in their state
                query = query.eq("state_id", assigned_location)
            elif location_level == "District":
                # District level users can see all voters in their district
                query = query.eq("district_id", assigned_location)
            elif location_level == "Constituency":
                # Constituency level users can see all voters in their constituency
                query = query.eq("constituency_id", assigned_location)
            elif location_level == "Division" or location_level == "Sub-Region":
                # Sub-region level users can see only their sub-region voters
                query = query.eq("sub_region_id", assigned_location)
    else:
        # Super admin can apply manual filters
        if state_id:
            query = query.eq("state_id", state_id)
        if district_id:
            query = query.eq("district_id", district_id)
        if constituency_id:
            query = query.eq("constituency_id", constituency_id)
        if sub_region_id:
            query = query.eq("sub_region_id", sub_region_id)
    
    # Apply search
    if search:
        if search_by == "epic":
            query = query.ilike("epic_number", f"%{search}%")
        elif search_by == "booth":
            query = query.ilike("booth_number", f"%{search}%")
        elif search_by == "house":
            query = query.ilike("house_number", f"%{search}%")
        elif search_by == "mobile":
            query = query.ilike("mobile_number", f"%{search}%")
        elif search_by == "part":
            query = query.ilike("part_number", f"%{search}%")
        else:  # default to name search
            query = query.ilike("full_name", f"%{search}%")
    
    # Pagination
    offset = (page - 1) * limit
    query = query.order("full_name").range(offset, offset + limit - 1)
    
    result = query.execute()
    total = result.count if result.count else 0
    
    return {
        "voters": result.data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit
    }

@api_router.get("/voters/stats/summary")
async def get_voter_stats(user: dict = Depends(get_current_user)):
    """Get voter statistics with hierarchical geofencing"""
    user_data = supabase.table("users").select("*").eq("id", user["id"]).execute()
    if not user_data.data:
        raise HTTPException(status_code=403, detail="User not found")
    
    user_info = user_data.data[0]
    if not user_info.get("can_access_voter_hub") and not user_info.get("is_super_admin"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = supabase.table("voters").select("*", count="exact")
    
    # Apply hierarchical geofencing for non-super admins
    if not user_info.get("is_super_admin"):
        location_level = user_info.get("location_level")
        assigned_location = user_info.get("assigned_location_id")
        
        if assigned_location and location_level:
            if location_level == "State":
                query = query.eq("state_id", assigned_location)
            elif location_level == "District":
                query = query.eq("district_id", assigned_location)
            elif location_level == "Constituency":
                query = query.eq("constituency_id", assigned_location)
            elif location_level == "Division" or location_level == "Sub-Region":
                query = query.eq("sub_region_id", assigned_location)
    
    result = query.execute()
    voters = result.data
    
    total = len(voters)
    male = len([v for v in voters if v.get("gender", "").lower() == "male"])
    female = len([v for v in voters if v.get("gender", "").lower() == "female"])
    booths = len(set([v.get("booth_number") for v in voters if v.get("booth_number")]))
    parts = len(set([v.get("part_number") for v in voters if v.get("part_number")]))
    
    return {
        "total_voters": total,
        "male_voters": male,
        "female_voters": female,
        "total_booths": booths,
        "total_parts": parts
    }

@api_router.get("/voters/{voter_id}")
async def get_voter(voter_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("voters").select("*").eq("id", voter_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Voter not found")
    return result.data[0]

@api_router.post("/voters")
async def create_voter(voter: VoterCreate, user: dict = Depends(get_current_user)):
    voter_data = {
        "id": str(uuid.uuid4()),
        "epic_number": voter.epic_number,
        "full_name": voter.full_name,
        "age": voter.age,
        "gender": voter.gender,
        "relative_name": voter.relative_name,
        "house_number": voter.house_number,
        "booth_number": voter.booth_number,
        "part_number": voter.part_number,
        "address": voter.address,
        "mobile_number": voter.mobile_number,
        "email": voter.email,
        "photo_url": voter.photo_url,
        "state_id": voter.state_id if voter.state_id else None,
        "district_id": voter.district_id if voter.district_id else None,
        "constituency_id": voter.constituency_id if voter.constituency_id else None,
        "sub_region_id": voter.sub_region_id if voter.sub_region_id else None,
        "location_name": voter.location_name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = supabase.table("voters").insert(voter_data).execute()
    return result.data[0]

@api_router.put("/voters/{voter_id}")
async def update_voter(voter_id: str, voter: VoterUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in voter.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Handle empty UUIDs
    for field in ["state_id", "district_id", "constituency_id", "sub_region_id"]:
        if field in update_data and update_data[field] == "":
            update_data[field] = None
    
    result = supabase.table("voters").update(update_data).eq("id", voter_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Voter not found")
    return result.data[0]

@api_router.delete("/voters/{voter_id}")
async def delete_voter(voter_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("voters").delete().eq("id", voter_id).execute()
    return {"success": True}


# ================== SOCIAL MEDIA HUB ==================

class SocialPostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    post_to_twitter: bool = False
    post_to_facebook: bool = False

class SocialPostUpdate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    post_to_twitter: Optional[bool] = None
    post_to_facebook: Optional[bool] = None
    status: Optional[str] = None

@api_router.get("/social-posts")
async def get_social_posts(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    user: dict = Depends(get_current_user)
):
    """Get social media posts"""
    # Check access
    user_data = supabase.table("users").select("*").eq("id", user["id"]).execute()
    if user_data.data:
        user_info = user_data.data[0]
        if not user_info.get("can_access_social_hub") and not user_info.get("is_super_admin"):
            raise HTTPException(status_code=403, detail="Access to Social Hub denied")
    
    query = supabase.table("social_posts").select("*", count="exact")
    
    if status:
        query = query.eq("status", status)
    
    offset = (page - 1) * limit
    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    
    result = query.execute()
    return {
        "posts": result.data,
        "total": result.count or 0,
        "page": page,
        "limit": limit
    }

@api_router.post("/social-posts")
async def create_social_post(post: SocialPostCreate, user: dict = Depends(get_current_user)):
    """Create a new social media post"""
    post_data = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "content": post.content[:280],  # Limit to 280 chars
        "media_url": post.media_url,
        "post_to_twitter": post.post_to_twitter,
        "post_to_facebook": post.post_to_facebook,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = supabase.table("social_posts").insert(post_data).execute()
    return result.data[0]

@api_router.post("/social-posts/{post_id}/publish")
async def publish_social_post(post_id: str, user: dict = Depends(get_current_user)):
    """Publish a social media post (mock - would integrate with real APIs)"""
    # Get the post
    post_result = supabase.table("social_posts").select("*").eq("id", post_id).execute()
    if not post_result.data:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post = post_result.data[0]
    
    # Mock publishing - in real implementation, would call Twitter/Facebook APIs
    published_platforms = []
    if post.get("post_to_twitter"):
        published_platforms.append("twitter")
        logger.info(f"[MOCK] Published to Twitter: {post['content'][:50]}...")
    if post.get("post_to_facebook"):
        published_platforms.append("facebook")
        logger.info(f"[MOCK] Published to Facebook: {post['content'][:50]}...")
    
    # Update post status
    update_result = supabase.table("social_posts").update({
        "status": "published",
        "published_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", post_id).execute()
    
    return {
        "success": True,
        "published_to": published_platforms,
        "post": update_result.data[0] if update_result.data else post
    }

@api_router.delete("/social-posts/{post_id}")
async def delete_social_post(post_id: str, user: dict = Depends(get_current_user)):
    result = supabase.table("social_posts").delete().eq("id", post_id).execute()
    return {"success": True}


# ================== USER MANAGEMENT (SUPER ADMIN) ==================

class SystemUserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "user"
    leader_profile_id: Optional[str] = None
    assigned_location_id: Optional[str] = None
    location_level: Optional[str] = None
    can_access_voter_hub: bool = False
    can_access_social_hub: bool = False
    is_super_admin: bool = False

class SystemUserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    leader_profile_id: Optional[str] = None
    assigned_location_id: Optional[str] = None
    location_level: Optional[str] = None
    can_access_voter_hub: Optional[bool] = None
    can_access_social_hub: Optional[bool] = None
    is_super_admin: Optional[bool] = None

def check_super_admin(user: dict):
    """Check if current user is a super admin"""
    user_data = supabase.table("users").select("*").eq("id", user["id"]).execute()
    if not user_data.data or not user_data.data[0].get("is_super_admin"):
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return user_data.data[0]

@api_router.get("/system-users")
async def get_system_users(user: dict = Depends(get_current_user)):
    """Get all system users (Super Admin only)"""
    check_super_admin(user)
    
    result = supabase.table("users").select("id, email, name, role, leader_profile_id, assigned_location_id, location_level, can_access_voter_hub, can_access_social_hub, is_super_admin, created_at").order("created_at", desc=True).execute()
    return result.data

@api_router.get("/system-users/{user_id}")
async def get_system_user(user_id: str, user: dict = Depends(get_current_user)):
    """Get a specific system user (Super Admin only)"""
    check_super_admin(user)
    
    result = supabase.table("users").select("id, email, name, role, leader_profile_id, assigned_location_id, location_level, can_access_voter_hub, can_access_social_hub, is_super_admin, created_at").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]

@api_router.post("/system-users")
async def create_system_user(sys_user: SystemUserCreate, user: dict = Depends(get_current_user)):
    """Create a new system user (Super Admin only)"""
    check_super_admin(user)
    
    # Check if email already exists
    existing = supabase.table("users").select("*").eq("email", sys_user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_data = {
        "id": str(uuid.uuid4()),
        "email": sys_user.email,
        "password_hash": hash_password(sys_user.password),
        "name": sys_user.name,
        "role": sys_user.role,
        "leader_profile_id": sys_user.leader_profile_id if sys_user.leader_profile_id else None,
        "assigned_location_id": sys_user.assigned_location_id if sys_user.assigned_location_id else None,
        "location_level": sys_user.location_level,
        "can_access_voter_hub": sys_user.can_access_voter_hub,
        "can_access_social_hub": sys_user.can_access_social_hub,
        "is_super_admin": sys_user.is_super_admin,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = supabase.table("users").insert(user_data).execute()
    # Return without password_hash
    created_user = result.data[0]
    del created_user["password_hash"]
    return created_user

@api_router.put("/system-users/{user_id}")
async def update_system_user(user_id: str, sys_user: SystemUserUpdate, user: dict = Depends(get_current_user)):
    """Update a system user (Super Admin only)"""
    check_super_admin(user)
    
    update_data = {k: v for k, v in sys_user.dict().items() if v is not None}
    
    # Handle empty UUIDs
    if "leader_profile_id" in update_data and update_data["leader_profile_id"] == "":
        update_data["leader_profile_id"] = None
    if "assigned_location_id" in update_data and update_data["assigned_location_id"] == "":
        update_data["assigned_location_id"] = None
    
    result = supabase.table("users").update(update_data).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return without password_hash
    updated_user = result.data[0]
    if "password_hash" in updated_user:
        del updated_user["password_hash"]
    return updated_user

@api_router.delete("/system-users/{user_id}")
async def delete_system_user(user_id: str, user: dict = Depends(get_current_user)):
    """Delete a system user (Super Admin only)"""
    admin = check_super_admin(user)
    
    # Prevent self-deletion
    if user_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = supabase.table("users").delete().eq("id", user_id).execute()
    return {"success": True}


# ================== DATA INGESTION ENGINE ==================

@api_router.post("/voters/bulk-import")
async def bulk_import_voters(
    file: UploadFile = File(...),
    location_id: Optional[str] = Form(None),
    location_name: Optional[str] = Form(None),
    user: dict = Depends(get_current_user)
):
    """Bulk import voters from CSV/Excel file"""
    check_super_admin(user)
    
    # Read file content
    content = await file.read()
    
    try:
        # Try to parse as CSV first
        if file.filename.endswith('.csv'):
            import csv
            import io
            decoded = content.decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
            rows = list(reader)
        else:
            # Try Excel
            import pandas as pd
            import io
            df = pd.read_excel(io.BytesIO(content))
            rows = df.to_dict('records')
        
        imported_count = 0
        errors = []
        
        for i, row in enumerate(rows):
            try:
                # Map common column names
                epic = row.get('epic_number') or row.get('EPIC') or row.get('EPIC No') or row.get('epic') or row.get('Voter ID')
                name = row.get('full_name') or row.get('Name') or row.get('name') or row.get('Voter Name')
                
                if not epic or not name:
                    errors.append(f"Row {i+1}: Missing EPIC number or name")
                    continue
                
                voter_data = {
                    "id": str(uuid.uuid4()),
                    "epic_number": str(epic).strip(),
                    "full_name": str(name).strip(),
                    "age": int(row.get('age') or row.get('Age') or 0) if row.get('age') or row.get('Age') else None,
                    "gender": row.get('gender') or row.get('Gender'),
                    "relative_name": row.get('relative_name') or row.get('Father Name') or row.get("Father's Name") or row.get('Husband Name'),
                    "house_number": row.get('house_number') or row.get('House No') or row.get('House Number'),
                    "booth_number": row.get('booth_number') or row.get('Booth No') or row.get('Booth Number'),
                    "part_number": row.get('part_number') or row.get('Part No') or row.get('Part Number'),
                    "address": row.get('address') or row.get('Address'),
                    "mobile_number": row.get('mobile_number') or row.get('Mobile') or row.get('Mobile Number') or row.get('Phone'),
                    "email": row.get('email') or row.get('Email') or row.get('Email ID'),
                    "state_id": row.get('state_id') or row.get('State ID'),
                    "district_id": row.get('district_id') or row.get('District ID'),
                    "constituency_id": row.get('constituency_id') or row.get('Constituency ID'),
                    "sub_region_id": row.get('sub_region_id') or row.get('Sub Region ID') or row.get('Division ID'),
                    "location_id": location_id if location_id else None,
                    "location_name": location_name,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                # Upsert - update if exists, insert if not
                existing = supabase.table("voters").select("id").eq("epic_number", voter_data["epic_number"]).execute()
                if existing.data:
                    supabase.table("voters").update(voter_data).eq("epic_number", voter_data["epic_number"]).execute()
                else:
                    supabase.table("voters").insert(voter_data).execute()
                
                imported_count += 1
            except Exception as e:
                errors.append(f"Row {i+1}: {str(e)}")
        
        return {
            "success": True,
            "imported": imported_count,
            "total_rows": len(rows),
            "errors": errors[:10]  # Return first 10 errors
        }
    
    except Exception as e:
        logger.error(f"Bulk import failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

@api_router.post("/voters/bulk-photos")
async def bulk_upload_voter_photos(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Bulk upload voter photos from ZIP file"""
    check_super_admin(user)
    
    import zipfile
    import io
    
    content = await file.read()
    
    try:
        updated_count = 0
        errors = []
        
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            for filename in zf.namelist():
                if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                    # Extract EPIC number from filename (e.g., ABC1234567.jpg)
                    epic_number = filename.rsplit('.', 1)[0].split('/')[-1].strip()
                    
                    # Read the image
                    image_data = zf.read(filename)
                    
                    # Upload to Supabase Storage
                    storage_path = f"voter-photos/{epic_number}.jpg"
                    try:
                        supabase.storage.from_("images").upload(
                            path=storage_path,
                            file=image_data,
                            file_options={"content-type": "image/jpeg", "upsert": "true"}
                        )
                        photo_url = supabase.storage.from_("images").get_public_url(storage_path)
                        
                        # Update voter record (case-insensitive EPIC match)
                        voters_result = supabase.table("voters").select("id, epic_number").execute()
                        matched_voter = None
                        for v in voters_result.data:
                            if v["epic_number"].strip().lower() == epic_number.lower():
                                matched_voter = v
                                break
                        
                        if matched_voter:
                            supabase.table("voters").update({
                                "photo_url": photo_url
                            }).eq("id", matched_voter["id"]).execute()
                            updated_count += 1
                        else:
                            errors.append(f"{epic_number}: Voter not found")
                    except Exception as e:
                        errors.append(f"{epic_number}: {str(e)}")
        
        return {
            "success": True,
            "updated": updated_count,
            "errors": errors[:10]
        }
    
    except Exception as e:
        logger.error(f"Photo upload failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to process ZIP file: {str(e)}")


# ================== REGISTER ROUTER (at the end) ==================
app.include_router(api_router)

# ================== STARTUP: seed admin ==================

def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@indianprofiles.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")

    existing = supabase.table("users").select("*").eq("email", admin_email).execute()
    if not existing.data:
        hashed = hash_password(admin_password)
        supabase.table("users").insert({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hashed,
            "name": "Administrator",
            "role": "admin",
            "is_super_admin": True,
            "can_access_voter_hub": True,
            "can_access_social_hub": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        logger.info(f"Admin user created: {admin_email}")
    else:
        # Update existing admin to be super admin
        supabase.table("users").update({
            "is_super_admin": True,
            "can_access_voter_hub": True,
            "can_access_social_hub": True
        }).eq("email", admin_email).execute()
        
        if not verify_password(admin_password, existing.data[0]["password_hash"]):
            supabase.table("users").update({
                "password_hash": hash_password(admin_password)
            }).eq("email", admin_email).execute()
            logger.info("Admin password updated")

@app.on_event("startup")
async def startup_event():
    seed_admin()
    logger.info("Application started — connected to Supabase")
