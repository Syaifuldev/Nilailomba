-- ============================================================
-- SEED: 10 nomor peserta dummy (masing-masing L dan P)
-- Total: 20 peserta (001–010, tiap nomor ada Laki-laki & Perempuan)
-- Jalankan di Supabase SQL Editor
-- ============================================================

INSERT INTO public.participants (participant_number, gender, status)
VALUES
  ('001', 'laki-laki',  'active'),
  ('001', 'perempuan',  'active'),
  ('002', 'laki-laki',  'active'),
  ('002', 'perempuan',  'active'),
  ('003', 'laki-laki',  'active'),
  ('003', 'perempuan',  'active'),
  ('004', 'laki-laki',  'active'),
  ('004', 'perempuan',  'active'),
  ('005', 'laki-laki',  'active'),
  ('005', 'perempuan',  'active'),
  ('006', 'laki-laki',  'active'),
  ('006', 'perempuan',  'active'),
  ('007', 'laki-laki',  'active'),
  ('007', 'perempuan',  'active'),
  ('008', 'laki-laki',  'active'),
  ('008', 'perempuan',  'active'),
  ('009', 'laki-laki',  'active'),
  ('009', 'perempuan',  'active'),
  ('010', 'laki-laki',  'active'),
  ('010', 'perempuan',  'active')
ON CONFLICT (participant_number, gender) DO NOTHING;
