-- ============================================================
-- SEED DATA — SISTEM PENILAIAN LOMBA
-- ============================================================
-- Jalankan file ini di Supabase SQL Editor.
--
-- URUTAN WAJIB:
-- 1. Jalankan schema.sql terlebih dahulu
-- 2. Buat auth users di Supabase Dashboard (email + password saja)
-- 3. Jalankan seed.sql ini (bagian A, B, C)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- BAGIAN A: DATA PESERTA (001 – 020)
-- ────────────────────────────────────────────────────────────
INSERT INTO public.participants (participant_number, status) VALUES
  ('001', 'active'),
  ('002', 'active'),
  ('003', 'active'),
  ('004', 'active'),
  ('005', 'active'),
  ('006', 'active'),
  ('007', 'active'),
  ('008', 'active'),
  ('009', 'active'),
  ('010', 'active'),
  ('011', 'active'),
  ('012', 'active'),
  ('013', 'active'),
  ('014', 'active'),
  ('015', 'active'),
  ('016', 'active'),
  ('017', 'active'),
  ('018', 'active'),
  ('019', 'active'),
  ('020', 'active')
ON CONFLICT (participant_number) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- BAGIAN B: DATA JURI DUMMY
-- ────────────────────────────────────────────────────────────
INSERT INTO public.judges (judge_name, judging_category, status) VALUES
  ('Juri Wudu', 'wudu', true),
  ('Juri Salat 1', 'salat', true),
  ('Juri Salat 2', 'salat', true)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- BAGIAN C: SET ROLE PENGGUNA
-- ────────────────────────────────────────────────────────────
-- Jalankan bagian ini SETELAH membuat 4 akun di Supabase
-- Dashboard > Authentication > Users:
--
--   Email                    | Password
--   -------------------------|----------
--   admin@lombaku.id         | Admin1234!
--   juri.wudu@lombaku.id     | Juri1234!
--   juri.salat1@lombaku.id   | Juri1234!
--   juri.salat2@lombaku.id   | Juri1234!
--
-- Setelah akun dibuat, jalankan SQL berikut untuk set role:
-- ────────────────────────────────────────────────────────────

-- Set role ADMIN
UPDATE public.profiles
SET
  role      = 'admin',
  full_name = 'Administrator',
  username  = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@lombaku.id' LIMIT 1
);

-- Set role JURI WUDU
UPDATE public.profiles
SET
  role      = 'juri',
  full_name = 'Juri Wudu',
  username  = 'juri_wudu'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'juri.wudu@lombaku.id' LIMIT 1
);

-- Set role JURI SALAT 1
UPDATE public.profiles
SET
  role      = 'juri',
  full_name = 'Juri Salat 1',
  username  = 'juri_salat1'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'juri.salat1@lombaku.id' LIMIT 1
);

-- Set role JURI SALAT 2
UPDATE public.profiles
SET
  role      = 'juri',
  full_name = 'Juri Salat 2',
  username  = 'juri_salat2'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'juri.salat2@lombaku.id' LIMIT 1
);

-- ────────────────────────────────────────────────────────────
-- VERIFIKASI: Cek hasil update
-- ────────────────────────────────────────────────────────────
-- Jalankan query ini untuk memastikan role sudah benar:
--
-- SELECT p.full_name, p.role, u.email
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.id;

-- ────────────────────────────────────────────────────────────
-- PENGATURAN LOMBA DEFAULT
-- ────────────────────────────────────────────────────────────
UPDATE public.competition_settings
SET
  competition_name   = 'Lomba Praktik Wudu dan Salat',
  competition_year   = '2026',
  organizer_name     = 'Panitia Lomba MAPSI',
  competition_status = 'draft'
WHERE id = (SELECT id FROM public.competition_settings LIMIT 1);
