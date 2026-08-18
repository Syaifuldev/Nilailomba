-- ============================================================
-- SISTEM PENILAIAN LOMBA — SCHEMA PHASE 2
-- Modul Penilaian Wudu & Salat
-- ============================================================
-- Jalankan SETELAH schema.sql sudah dijalankan
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. WUDU CRITERIA TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wudu_criteria (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criteria_number  INTEGER NOT NULL UNIQUE,
  criteria_name    TEXT NOT NULL,
  maximum_score    NUMERIC NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. WUDU SCORES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wudu_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  judge_id        UUID NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  criteria_id     UUID NOT NULL REFERENCES public.wudu_criteria(id) ON DELETE CASCADE,
  score           NUMERIC NOT NULL DEFAULT 0,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'saved', 'finalized')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, judge_id, criteria_id)
);

DROP TRIGGER IF EXISTS wudu_scores_updated_at ON public.wudu_scores;
CREATE TRIGGER wudu_scores_updated_at
  BEFORE UPDATE ON public.wudu_scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS wudu_scores_participant_judge_idx
  ON public.wudu_scores(participant_id, judge_id);

-- ────────────────────────────────────────────────────────────
-- 3. PRAYER SCORE GROUPS TABLE
--    (Kelompok skor salat — 13 kelompok, total = 250)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prayer_score_groups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code       TEXT NOT NULL UNIQUE,
  group_name       TEXT NOT NULL,
  criteria_numbers INTEGER[] NOT NULL,
  criteria_names   TEXT[] NOT NULL,
  maximum_score    NUMERIC NOT NULL,
  sort_order       INTEGER NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 4. PRAYER SCORES TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prayer_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  judge_id        UUID NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  group_id        UUID NOT NULL REFERENCES public.prayer_score_groups(id) ON DELETE CASCADE,
  error_count     INTEGER NOT NULL DEFAULT 0,
  score           NUMERIC NOT NULL DEFAULT 0,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'saved', 'finalized')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (participant_id, judge_id, group_id)
);

DROP TRIGGER IF EXISTS prayer_scores_updated_at ON public.prayer_scores;
CREATE TRIGGER prayer_scores_updated_at
  BEFORE UPDATE ON public.prayer_scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS prayer_scores_participant_judge_idx
  ON public.prayer_scores(participant_id, judge_id);

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.wudu_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wudu_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_score_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_scores ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- RLS: WUDU_CRITERIA (read-only for all authenticated users)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "wudu_criteria_select_all" ON public.wudu_criteria;
CREATE POLICY "wudu_criteria_select_all"
  ON public.wudu_criteria FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "wudu_criteria_admin_all" ON public.wudu_criteria;
CREATE POLICY "wudu_criteria_admin_all"
  ON public.wudu_criteria FOR ALL
  USING (public.get_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- RLS: PRAYER_SCORE_GROUPS (read-only for all authenticated)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "prayer_groups_select_all" ON public.prayer_score_groups;
CREATE POLICY "prayer_groups_select_all"
  ON public.prayer_score_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "prayer_groups_admin_all" ON public.prayer_score_groups;
CREATE POLICY "prayer_groups_admin_all"
  ON public.prayer_score_groups FOR ALL
  USING (public.get_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- RLS: WUDU_SCORES
-- ────────────────────────────────────────────────────────────

-- SELECT: juri baca skor sendiri, admin baca semua
DROP POLICY IF EXISTS "wudu_scores_select" ON public.wudu_scores;
CREATE POLICY "wudu_scores_select"
  ON public.wudu_scores FOR SELECT
  USING (
    public.get_user_role() = 'admin'
    OR public.get_user_role() = 'operator'
    OR EXISTS (
      SELECT 1 FROM public.judges
      WHERE judges.id = wudu_scores.judge_id
        AND judges.user_id = auth.uid()
    )
  );

-- INSERT: juri buat skor atas nama dirinya sendiri
DROP POLICY IF EXISTS "wudu_scores_insert" ON public.wudu_scores;
CREATE POLICY "wudu_scores_insert"
  ON public.wudu_scores FOR INSERT
  WITH CHECK (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.judges
      WHERE judges.id = judge_id
        AND judges.user_id = auth.uid()
    )
  );

-- UPDATE: juri ubah skor miliknya (belum finalized), admin bisa ubah semua
DROP POLICY IF EXISTS "wudu_scores_update" ON public.wudu_scores;
CREATE POLICY "wudu_scores_update"
  ON public.wudu_scores FOR UPDATE
  USING (
    public.get_user_role() = 'admin'
    OR (
      status != 'finalized'
      AND EXISTS (
        SELECT 1 FROM public.judges
        WHERE judges.id = wudu_scores.judge_id
          AND judges.user_id = auth.uid()
      )
    )
  );

-- DELETE: admin only
DROP POLICY IF EXISTS "wudu_scores_delete" ON public.wudu_scores;
CREATE POLICY "wudu_scores_delete"
  ON public.wudu_scores FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- RLS: PRAYER_SCORES
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "prayer_scores_select" ON public.prayer_scores;
CREATE POLICY "prayer_scores_select"
  ON public.prayer_scores FOR SELECT
  USING (
    public.get_user_role() = 'admin'
    OR public.get_user_role() = 'operator'
    OR EXISTS (
      SELECT 1 FROM public.judges
      WHERE judges.id = prayer_scores.judge_id
        AND judges.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "prayer_scores_insert" ON public.prayer_scores;
CREATE POLICY "prayer_scores_insert"
  ON public.prayer_scores FOR INSERT
  WITH CHECK (
    public.get_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.judges
      WHERE judges.id = judge_id
        AND judges.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "prayer_scores_update" ON public.prayer_scores;
CREATE POLICY "prayer_scores_update"
  ON public.prayer_scores FOR UPDATE
  USING (
    public.get_user_role() = 'admin'
    OR (
      status != 'finalized'
      AND EXISTS (
        SELECT 1 FROM public.judges
        WHERE judges.id = prayer_scores.judge_id
          AND judges.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "prayer_scores_delete" ON public.prayer_scores;
CREATE POLICY "prayer_scores_delete"
  ON public.prayer_scores FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- DATA: WUDU CRITERIA (11 kriteria, total = 100)
-- ============================================================
INSERT INTO public.wudu_criteria (criteria_number, criteria_name, maximum_score) VALUES
  (1,  'Mencuci tangan',                      5),
  (2,  'Berkumur',                             5),
  (3,  'Membersihkan lubang hidung',           5),
  (4,  'Membaca niat secara jelas (jahr)',     15),
  (5,  'Membasuh muka',                        10),
  (6,  'Membasuh tangan sampai siku',          10),
  (7,  'Mengusap kepala',                      10),
  (8,  'Membasuh telinga',                     10),
  (9,  'Membasuh kaki',                        10),
  (10, 'Tertib',                               10),
  (11, 'Doa setelah wudu',                     10)
ON CONFLICT (criteria_number) DO NOTHING;

-- ============================================================
-- DATA: PRAYER SCORE GROUPS (13 kelompok, total = 250)
-- ============================================================
INSERT INTO public.prayer_score_groups
  (group_code, group_name, criteria_numbers, criteria_names, maximum_score, sort_order)
VALUES
  (
    'A',
    'Berdiri tegak – Niat – Takbiratul Ihram',
    ARRAY[1, 2, 3],
    ARRAY[
      'Berdiri tegak menghadap kiblat',
      'Mengucapkan lafal niat secara jelas (jahr)',
      'Mengucapkan takbiratul ihram'
    ],
    10, 1
  ),
  (
    'B',
    'Angkat tangan – Bersedekap',
    ARRAY[4, 5],
    ARRAY[
      'Mengangkat kedua tangan ketika takbiratul ihram',
      'Berdiri tegak tangan bersedekap'
    ],
    7, 2
  ),
  (
    'C',
    'Doa Iftitah',
    ARRAY[6],
    ARRAY['Membaca doa Iftitah'],
    10, 3
  ),
  (
    'D',
    'Surah Al-Fatihah',
    ARRAY[7],
    ARRAY['Membaca Surah Al-Fatihah'],
    58, 4
  ),
  (
    'E',
    'Surah Ad-Duha',
    ARRAY[8],
    ARRAY['Membaca Surah Ad-Duha'],
    40, 5
  ),
  (
    'F',
    'Intiqal – Rukuk',
    ARRAY[9, 10],
    ARRAY[
      'Gerakan intiqal dengan mengucapkan takbir',
      'Melakukan rukuk'
    ],
    10, 6
  ),
  (
    'G',
    'Tasbih Rukuk – I''tidal – Rabbana',
    ARRAY[11, 12, 13],
    ARRAY[
      'Membaca tasbih ketika rukuk',
      'Gerakan intiqal untuk i''tidal dengan mengucapkan tasmi''',
      'Membaca rabbana lakal hamdu dan seterusnya'
    ],
    10, 7
  ),
  (
    'H',
    'Intiqal – Sujud Pertama',
    ARRAY[14, 15],
    ARRAY[
      'Gerakan intiqal dengan mengucapkan takbir',
      'Melakukan sujud pertama'
    ],
    10, 8
  ),
  (
    'I',
    'Tasbih Sujud Pertama – Intiqal Bangkit',
    ARRAY[16, 17],
    ARRAY[
      'Membaca tasbih sujud pertama',
      'Gerakan intiqal dengan mengucapkan takbir'
    ],
    10, 9
  ),
  (
    'J',
    'Duduk Iftirasy',
    ARRAY[18],
    ARRAY['Duduk iftirasy baina sajdatain'],
    5, 10
  ),
  (
    'K',
    'Doa Duduk – Intiqal ke Sujud Kedua',
    ARRAY[19, 20],
    ARRAY[
      'Membaca rabbighfirli warhamni dan seterusnya',
      'Gerakan intiqal dengan mengucapkan takbir'
    ],
    10, 11
  ),
  (
    'L',
    'Sujud Kedua – Tasbih Sujud Kedua',
    ARRAY[21, 22],
    ARRAY[
      'Melakukan sujud kedua',
      'Membaca tasbih sujud kedua'
    ],
    10, 12
  ),
  (
    'M',
    'Intiqal – Duduk Tawarruk – Tahiyat – Tasyahud – Salawat – Doa – Salam Pertama',
    ARRAY[23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
    ARRAY[
      'Gerakan intiqal dengan mengucapkan takbir',
      'Melakukan duduk tawarruk',
      'Membaca tahiyat',
      'Membaca tasyahud atau syahadatain',
      'Membaca salawat Nabi Muhammad',
      'Membaca salawat Ibrahimiyah',
      'Membaca fil ''alamina innaka hamidun majid',
      'Membaca doa terhindar siksa kubur',
      'Menoleh ke kanan untuk salam pertama',
      'Mengucapkan salam pertama'
    ],
    50, 13
  ),
  (
    'N',
    'Salam Kedua',
    ARRAY[33, 34],
    ARRAY[
      'Menoleh ke kiri untuk salam kedua',
      'Mengucapkan salam kedua'
    ],
    10, 14
  )
ON CONFLICT (group_code) DO NOTHING;

-- ============================================================
-- VERIFIKASI TOTAL
-- ============================================================
-- SELECT SUM(maximum_score) FROM public.prayer_score_groups; -- harus = 250
-- SELECT SUM(maximum_score) FROM public.wudu_criteria;       -- harus = 100
--
-- Grup breakdown (14 grup):
-- A(1-3)=10, B(4-5)=7, C(6)=10, D(7)=58, E(8)=40,
-- F(9-10)=10, G(11-13)=10, H(14-15)=10, I(16-17)=10,
-- J(18)=5, K(19-20)=10, L(21-22)=10, M(23-32)=50, N(33-34)=10
-- TOTAL = 250
