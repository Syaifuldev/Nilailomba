-- ============================================================
-- MIGRATION: Ubah unique constraint participants
-- Tiap nomor peserta bisa punya Laki-laki DAN Perempuan
-- ============================================================
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Hapus unique constraint lama pada participant_number
ALTER TABLE public.participants
  DROP CONSTRAINT IF EXISTS participants_participant_number_key;

-- 2. Tambah unique constraint baru: kombinasi (nomor + gender)
--    Sehingga 001-L dan 001-P adalah peserta berbeda
ALTER TABLE public.participants
  ADD CONSTRAINT participants_number_gender_key
  UNIQUE (participant_number, gender);

-- 3. Update index lama jika ada
DROP INDEX IF EXISTS participants_number_idx;
CREATE INDEX IF NOT EXISTS participants_number_gender_idx
  ON public.participants(participant_number, gender);
