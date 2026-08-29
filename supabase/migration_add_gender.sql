-- ============================================================
-- MIGRATION: Add gender column to participants table
-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS gender TEXT
    CHECK (gender IN ('laki-laki', 'perempuan'));

-- Optional: create an index for filtering by gender
CREATE INDEX IF NOT EXISTS participants_gender_idx
  ON public.participants(gender);
