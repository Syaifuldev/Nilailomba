-- ============================================================
-- SISTEM PENILAIAN LOMBA MAPSI — SCHEMA PHASE 3
-- Dashboard Final, Ranking, Audit Log
-- ============================================================
-- Jalankan SETELAH schema.sql dan schema_phase2.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. COMPETITION RESULTS TABLE (Snapshot Hasil Final)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competition_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id      UUID NOT NULL UNIQUE REFERENCES public.participants(id) ON DELETE CASCADE,
  final_wudu_score    NUMERIC NOT NULL DEFAULT 0,
  final_prayer_score  NUMERIC NOT NULL DEFAULT 0,
  total_score         NUMERIC NOT NULL DEFAULT 0,
  percentage          NUMERIC NOT NULL DEFAULT 0,
  ranking             INTEGER,
  result_status       TEXT NOT NULL DEFAULT 'draft'
                        CHECK (result_status IN ('draft', 'published')),
  finalized_at        TIMESTAMPTZ,
  finalized_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS competition_results_updated_at ON public.competition_results;
CREATE TRIGGER competition_results_updated_at
  BEFORE UPDATE ON public.competition_results
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS competition_results_ranking_idx
  ON public.competition_results(ranking);

-- ────────────────────────────────────────────────────────────
-- 2. AUDIT LOGS TABLE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  participant_id  UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  old_value       JSONB,
  new_value       JSONB,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_idx        ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_participant_idx  ON public.audit_logs(participant_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx  ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx      ON public.audit_logs(entity_type, entity_id);

-- ────────────────────────────────────────────────────────────
-- 3. VIEW: PARTICIPANT SCORES (Aggregated Multi-Judge)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.participant_scores_view AS
WITH wudu_by_judge AS (
  SELECT
    ws.participant_id,
    ws.judge_id,
    SUM(ws.score) AS judge_wudu_total
  FROM public.wudu_scores ws
  WHERE ws.status = 'finalized'
  GROUP BY ws.participant_id, ws.judge_id
),
salat_by_judge AS (
  SELECT
    ps.participant_id,
    ps.judge_id,
    SUM(ps.score) AS judge_salat_total
  FROM public.prayer_scores ps
  WHERE ps.status = 'finalized'
  GROUP BY ps.participant_id, ps.judge_id
),
wudu_avg AS (
  SELECT
    participant_id,
    ROUND(AVG(judge_wudu_total), 2) AS wudu_score,
    COUNT(*) AS wudu_judge_count
  FROM wudu_by_judge
  GROUP BY participant_id
),
salat_avg AS (
  SELECT
    participant_id,
    ROUND(AVG(judge_salat_total), 2) AS salat_score,
    COUNT(*) AS salat_judge_count
  FROM salat_by_judge
  GROUP BY participant_id
)
SELECT
  p.id                                            AS participant_id,
  p.participant_number,
  COALESCE(wa.wudu_score, 0)                      AS wudu_score,
  COALESCE(sa.salat_score, 0)                     AS salat_score,
  ROUND(COALESCE(wa.wudu_score, 0) + COALESCE(sa.salat_score, 0), 2)
                                                  AS total_score,
  ROUND(
    ((COALESCE(wa.wudu_score, 0) + COALESCE(sa.salat_score, 0)) / 350.0) * 100,
    2
  )                                               AS percentage,
  COALESCE(wa.wudu_judge_count, 0)                AS wudu_judge_count,
  COALESCE(sa.salat_judge_count, 0)               AS salat_judge_count,
  CASE
    WHEN wa.wudu_score IS NULL AND sa.salat_score IS NULL THEN 'belum'
    WHEN wa.wudu_score IS NOT NULL AND sa.salat_score IS NOT NULL THEN 'selesai'
    ELSE 'sebagian'
  END                                             AS score_status
FROM public.participants p
LEFT JOIN wudu_avg  wa ON p.id = wa.participant_id
LEFT JOIN salat_avg sa ON p.id = sa.participant_id
WHERE p.status = 'active';

-- ────────────────────────────────────────────────────────────
-- 4. VIEW: RANKING VIEW (with RANK() window function)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.participant_ranking_view AS
SELECT
  psv.*,
  RANK() OVER (
    ORDER BY psv.total_score DESC, psv.salat_score DESC
  ) AS ranking
FROM public.participant_scores_view psv
WHERE psv.score_status = 'selesai';

-- ────────────────────────────────────────────────────────────
-- 5. ENABLE RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── competition_results policies ────────────────────────────
DROP POLICY IF EXISTS "results_select_all" ON public.competition_results;
CREATE POLICY "results_select_all"
  ON public.competition_results FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "results_admin_all" ON public.competition_results;
CREATE POLICY "results_admin_all"
  ON public.competition_results FOR ALL
  USING (public.get_user_role() = 'admin');

-- ─── audit_logs policies ─────────────────────────────────────
DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_logs;
CREATE POLICY "audit_select_admin"
  ON public.audit_logs FOR SELECT
  USING (public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "audit_insert_authenticated" ON public.audit_logs;
CREATE POLICY "audit_insert_authenticated"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ────────────────────────────────────────────────────────────
-- 6. INDEXES FOR PERFORMANCE
-- ────────────────────────────────────────────────────────────
-- Already created above; additional compound indexes:
CREATE INDEX IF NOT EXISTS wudu_scores_status_participant_idx
  ON public.wudu_scores(status, participant_id);

CREATE INDEX IF NOT EXISTS prayer_scores_status_participant_idx
  ON public.prayer_scores(status, participant_id);

CREATE INDEX IF NOT EXISTS participants_status_number_idx
  ON public.participants(status, participant_number);
