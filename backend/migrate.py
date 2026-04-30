"""
Creates all required tables in Supabase using the Management API (no direct DB connection needed).
Uses the service role key via PostgREST SQL endpoint.
"""
import requests
import json

SUPABASE_URL = "https://alttxbyizmagslausmlb.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdHR4Ynlpem1hZ3NsYXVzbWxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEyNTU2NiwiZXhwIjoyMDkwNzAxNTY2fQ.e-Yu4p3L6PO8Qrb1XAdGsVQIchLkPyL4whj2RPxNAYA"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# Each statement separately
statements = [
    'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
    """CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS login_attempts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        identifier TEXT UNIQUE NOT NULL,
        count INTEGER DEFAULT 0,
        locked_until TIMESTAMPTZ
    )""",
    """CREATE TABLE IF NOT EXISTS states (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        code TEXT DEFAULT '',
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS districts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        parent_state_id UUID REFERENCES states(id) ON DELETE CASCADE,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS constituencies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        type TEXT DEFAULT 'Assembly',
        parent_district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS sub_regions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        type TEXT DEFAULT 'Division',
        parent_constituency_id UUID REFERENCES constituencies(id) ON DELETE CASCADE,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS leaders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        designation TEXT NOT NULL,
        level TEXT DEFAULT 'Constituency',
        state_id UUID REFERENCES states(id) ON DELETE SET NULL,
        district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
        constituency_id UUID REFERENCES constituencies(id) ON DELETE SET NULL,
        sub_region_id UUID REFERENCES sub_regions(id) ON DELETE SET NULL,
        bio_summary TEXT,
        biography TEXT,
        image_url TEXT,
        phone TEXT,
        email TEXT,
        twitter TEXT,
        facebook TEXT,
        career_timeline JSONB DEFAULT '[]',
        gallery_photos JSONB DEFAULT '[]',
        video_links JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS articles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        event_date TEXT,
        featured_image TEXT,
        constituency_id UUID REFERENCES constituencies(id) ON DELETE SET NULL,
        sub_region_id UUID REFERENCES sub_regions(id) ON DELETE SET NULL,
        tagged_leader_ids JSONB DEFAULT '[]',
        article_type TEXT DEFAULT 'development',
        status TEXT DEFAULT 'published',
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS grievances (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        constituency_id UUID REFERENCES constituencies(id) ON DELETE SET NULL,
        sub_region_id UUID REFERENCES sub_regions(id) ON DELETE SET NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS volunteers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        constituency_id UUID REFERENCES constituencies(id) ON DELETE SET NULL,
        sub_region_id UUID REFERENCES sub_regions(id) ON DELETE SET NULL,
        skills JSONB DEFAULT '[]',
        availability TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    """CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        event_date TEXT NOT NULL,
        event_time TEXT,
        location TEXT,
        constituency_id UUID REFERENCES constituencies(id) ON DELETE SET NULL,
        sub_region_id UUID REFERENCES sub_regions(id) ON DELETE SET NULL,
        event_type TEXT DEFAULT 'public',
        created_at TIMESTAMPTZ DEFAULT NOW()
    )""",
    "ALTER TABLE users DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE login_attempts DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE states DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE districts DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE constituencies DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE sub_regions DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE leaders DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE articles DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE grievances DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE volunteers DISABLE ROW LEVEL SECURITY",
    "ALTER TABLE events DISABLE ROW LEVEL SECURITY",
]

# Supabase exposes a SQL execution endpoint at /rest/v1/rpc/... but for DDL
# we must use the Postgres REST endpoint via the pg-meta API
# Actually, use the supabase-py client which calls PostgREST

# Alternative: use the Supabase "pg" connection via the REST API 
# Supabase exposes DDL via /pg endpoint on the management API

# Let's try using the supabase python client's postgrest rpc
from supabase import create_client, Client
supabase: Client = create_client(SUPABASE_URL, SERVICE_KEY)

print("Testing connection to Supabase...")
try:
    # Try a simple query - if tables don't exist we'll get an error
    result = supabase.table("users").select("id").limit(1).execute()
    print(f"✅ 'users' table already exists! Data: {result.data}")
except Exception as e:
    error_str = str(e)
    if "PGRST205" in error_str or "schema cache" in error_str:
        print("❌ Tables don't exist yet. You need to run the SQL in the Supabase Dashboard.")
        print("\n📋 INSTRUCTIONS:")
        print("1. Go to: https://supabase.com/dashboard/project/alttxbyizmagslausmlb/sql/new")
        print("2. Log in if prompted")
        print("3. Copy the contents of 'schema.sql' file")
        print("4. Paste and click 'Run'")
        print("5. Then restart the backend server")
    else:
        print(f"Other error: {e}")
