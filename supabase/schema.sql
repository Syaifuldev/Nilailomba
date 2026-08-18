-- ============================================================
-- SISTEM PENILAIAN LOMBA — SUPABASE SCHEMA
-- ============================================================
-- Run this entire file in Supabase SQL Editor
-- Project: Sistem Penilaian Lomba (Wudu & Salat)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'juri' CHECK (role IN ('admin', 'juri', 'operator')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'juri')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: update updated_at on profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ────────────────────────────────────────────────────────────
-- 2. JUDGES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.judges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  judge_name        TEXT NOT NULL,
  judging_category  TEXT NOT NULL CHECK (judging_category IN ('wudu', 'salat', 'wudu_dan_salat')),
  status            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS judges_updated_at ON public.judges;
CREATE TRIGGER judges_updated_at
  BEFORE UPDATE ON public.judges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ────────────────────────────────────────────────────────────
-- 3. PARTICIPANTS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.participants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_number  TEXT UNIQUE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS participants_updated_at ON public.participants;
CREATE TRIGGER participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index for faster search
CREATE INDEX IF NOT EXISTS participants_number_idx ON public.participants(participant_number);

-- ────────────────────────────────────────────────────────────
-- 4. COMPETITION SETTINGS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competition_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_name    TEXT,
  competition_year    TEXT,
  organizer_name      TEXT,
  competition_date    DATE,
  scoring_method      TEXT NOT NULL DEFAULT 'total' CHECK (scoring_method IN ('total', 'average', 'weighted')),
  competition_status  TEXT NOT NULL DEFAULT 'draft' CHECK (competition_status IN ('draft', 'active', 'completed')),
  logo_url            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS competition_settings_updated_at ON public.competition_settings;
CREATE TRIGGER competition_settings_updated_at
  BEFORE UPDATE ON public.competition_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings row (singleton pattern)
INSERT INTO public.competition_settings (
  competition_name,
  competition_year,
  organizer_name,
  competition_status
) VALUES (
  'Lomba Praktik Wudu dan Salat',
  '2026',
  'Panitia Lomba',
  'draft'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_settings ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- Helper function: get current user role
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────
-- PROFILES POLICIES
-- ────────────────────────────────────────────────────────────
-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Admin can read all profiles
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'admin');

-- Users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Admin can update any profile
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- Admin can insert profiles
DROP POLICY IF EXISTS "profiles_insert_admin" ON public.profiles;
CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

-- Admin can delete profiles
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- JUDGES POLICIES
-- ────────────────────────────────────────────────────────────
-- Admin: full access
DROP POLICY IF EXISTS "judges_all_admin" ON public.judges;
CREATE POLICY "judges_all_admin"
  ON public.judges FOR ALL
  USING (public.get_user_role() = 'admin');

-- Juri: can read their own judge record
DROP POLICY IF EXISTS "judges_select_own_juri" ON public.judges;
CREATE POLICY "judges_select_own_juri"
  ON public.judges FOR SELECT
  USING (
    public.get_user_role() = 'juri'
    AND user_id = auth.uid()
  );

-- Operator: can read all judges (view only)
DROP POLICY IF EXISTS "judges_select_operator" ON public.judges;
CREATE POLICY "judges_select_operator"
  ON public.judges FOR SELECT
  USING (public.get_user_role() = 'operator');

-- ────────────────────────────────────────────────────────────
-- PARTICIPANTS POLICIES
-- ────────────────────────────────────────────────────────────
-- Admin: full access
DROP POLICY IF EXISTS "participants_all_admin" ON public.participants;
CREATE POLICY "participants_all_admin"
  ON public.participants FOR ALL
  USING (public.get_user_role() = 'admin');

-- Juri: read only
DROP POLICY IF EXISTS "participants_select_juri" ON public.participants;
CREATE POLICY "participants_select_juri"
  ON public.participants FOR SELECT
  USING (public.get_user_role() = 'juri');

-- Operator: read and write (manage participants)
DROP POLICY IF EXISTS "participants_select_operator" ON public.participants;
CREATE POLICY "participants_select_operator"
  ON public.participants FOR SELECT
  USING (public.get_user_role() = 'operator');

DROP POLICY IF EXISTS "participants_insert_operator" ON public.participants;
CREATE POLICY "participants_insert_operator"
  ON public.participants FOR INSERT
  WITH CHECK (public.get_user_role() = 'operator');

DROP POLICY IF EXISTS "participants_update_operator" ON public.participants;
CREATE POLICY "participants_update_operator"
  ON public.participants FOR UPDATE
  USING (public.get_user_role() = 'operator');

-- ────────────────────────────────────────────────────────────
-- COMPETITION SETTINGS POLICIES
-- ────────────────────────────────────────────────────────────
-- Admin: full access
DROP POLICY IF EXISTS "settings_all_admin" ON public.competition_settings;
CREATE POLICY "settings_all_admin"
  ON public.competition_settings FOR ALL
  USING (public.get_user_role() = 'admin');

-- Juri and Operator: read only
DROP POLICY IF EXISTS "settings_select_juri_operator" ON public.competition_settings;
CREATE POLICY "settings_select_juri_operator"
  ON public.competition_settings FOR SELECT
  USING (public.get_user_role() IN ('juri', 'operator'));

