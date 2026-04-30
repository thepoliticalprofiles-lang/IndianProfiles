-- ============================================================
-- Indian Profiles Dashboard — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (custom auth, not Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'user',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOGIN ATTEMPTS (brute-force protection)
-- ============================================================
CREATE TABLE IF NOT EXISTS login_attempts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier  TEXT UNIQUE NOT NULL,
    count       INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ
);

-- ============================================================
-- GEOGRAPHY TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS states (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    code        TEXT DEFAULT '',
    description TEXT,
    image_url   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS districts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    parent_state_id UUID REFERENCES states(id) ON DELETE CASCADE,
    description     TEXT,
    image_url       TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS constituencies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    type                TEXT DEFAULT 'Assembly',
    parent_district_id  UUID REFERENCES districts(id) ON DELETE CASCADE,
    description         TEXT,
    image_url           TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_regions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    TEXT NOT NULL,
    type                    TEXT DEFAULT 'Division',
    parent_constituency_id  UUID REFERENCES constituencies(id) ON DELETE CASCADE,
    description             TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEADERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leaders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    designation         TEXT NOT NULL,
    level               TEXT DEFAULT 'Constituency',
    state_id            UUID REFERENCES states(id) ON DELETE SET NULL,
    district_id         UUID REFERENCES districts(id) ON DELETE SET NULL,
    constituency_id     UUID REFERENCES constituencies(id) ON DELETE SET NULL,
    sub_region_id       UUID REFERENCES sub_regions(id) ON DELETE SET NULL,
    bio_summary         TEXT,
    biography           TEXT,
    image_url           TEXT,
    phone               TEXT,
    email               TEXT,
    twitter             TEXT,
    facebook            TEXT,
    career_timeline     JSONB DEFAULT '[]',
    gallery_photos      JSONB DEFAULT '[]',
    video_links         JSONB DEFAULT '[]',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ARTICLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               TEXT NOT NULL,
    content             TEXT NOT NULL,
    event_date          TEXT,
    featured_image      TEXT,
    constituency_id     UUID REFERENCES constituencies(id) ON DELETE SET NULL,
    sub_region_id       UUID REFERENCES sub_regions(id) ON DELETE SET NULL,
    tagged_leader_ids   JSONB DEFAULT '[]',
    article_type        TEXT DEFAULT 'development',
    status              TEXT DEFAULT 'published',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GRIEVANCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS grievances (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    phone               TEXT NOT NULL,
    email               TEXT,
    constituency_id     UUID REFERENCES constituencies(id) ON DELETE SET NULL,
    sub_region_id       UUID REFERENCES sub_regions(id) ON DELETE SET NULL,
    category            TEXT NOT NULL,
    description         TEXT NOT NULL,
    status              TEXT DEFAULT 'pending',
    admin_notes         TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VOLUNTEERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    phone               TEXT NOT NULL,
    email               TEXT,
    constituency_id     UUID REFERENCES constituencies(id) ON DELETE SET NULL,
    sub_region_id       UUID REFERENCES sub_regions(id) ON DELETE SET NULL,
    skills              JSONB DEFAULT '[]',
    availability        TEXT,
    status              TEXT DEFAULT 'pending',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               TEXT NOT NULL,
    description         TEXT,
    event_date          TEXT NOT NULL,
    event_time          TEXT,
    location            TEXT,
    constituency_id     UUID REFERENCES constituencies(id) ON DELETE SET NULL,
    sub_region_id       UUID REFERENCES sub_regions(id) ON DELETE SET NULL,
    event_type          TEXT DEFAULT 'public',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DISABLE RLS (backend uses service_role key — full access)
-- ============================================================
ALTER TABLE users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts  DISABLE ROW LEVEL SECURITY;
ALTER TABLE states          DISABLE ROW LEVEL SECURITY;
ALTER TABLE districts       DISABLE ROW LEVEL SECURITY;
ALTER TABLE constituencies  DISABLE ROW LEVEL SECURITY;
ALTER TABLE sub_regions     DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaders         DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles        DISABLE ROW LEVEL SECURITY;
ALTER TABLE grievances      DISABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers      DISABLE ROW LEVEL SECURITY;
ALTER TABLE events          DISABLE ROW LEVEL SECURITY;
