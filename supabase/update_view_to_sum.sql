-- 1. DROP VIEW LAMA AGAR TIDAK BENTROK (Cascade ke ranking_view)
DROP VIEW IF EXISTS public.participant_scores_view CASCADE;

-- 2. BUAT VIEW BARU DENGAN LOGIKA SUM
CREATE OR REPLACE VIEW public.participant_scores_view AS
WITH wudu_by_judge AS (
  SELECT
    ps.participant_id,
    ps.judge_id,
    SUM(ps.score) AS judge_wudu_total
  FROM public.wudu_scores ps
  WHERE ps.status = 'finalized'
  GROUP BY ps.participant_id, ps.judge_id
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
wudu_sum AS (
  SELECT
    participant_id,
    SUM(judge_wudu_total) AS wudu_score,
    COUNT(*) AS wudu_judge_count
  FROM wudu_by_judge
  GROUP BY participant_id
),
salat_sum AS (
  SELECT
    participant_id,
    SUM(judge_salat_total) AS salat_score,
    COUNT(*) AS salat_judge_count
  FROM salat_by_judge
  GROUP BY participant_id
)
SELECT
  p.id                                            AS participant_id,
  p.participant_number,
  COALESCE(ws.wudu_score, 0)                      AS wudu_score,
  COALESCE(ss.salat_score, 0)                     AS salat_score,
  (COALESCE(ws.wudu_score, 0) + COALESCE(ss.salat_score, 0)) AS total_score,
  COALESCE(
    ROUND(
      (
        (COALESCE(ws.wudu_score, 0) + COALESCE(ss.salat_score, 0)) 
        / 
        NULLIF(((COALESCE(ws.wudu_judge_count, 0) * 100) + (COALESCE(ss.salat_judge_count, 0) * 250)), 0)::numeric
      ) * 100,
      2
    ), 
    0
  )                                               AS percentage,
  COALESCE(ws.wudu_judge_count, 0)                AS wudu_judge_count,
  COALESCE(ss.salat_judge_count, 0)               AS salat_judge_count,
  CASE
    WHEN ws.wudu_score IS NULL AND ss.salat_score IS NULL THEN 'belum'
    WHEN ws.wudu_score IS NOT NULL AND ss.salat_score IS NOT NULL THEN 'selesai'
    ELSE 'sebagian'
  END                                             AS score_status
FROM public.participants p
LEFT JOIN wudu_sum  ws ON p.id = ws.participant_id
LEFT JOIN salat_sum ss ON p.id = ss.participant_id
WHERE p.status = 'active';

-- 3. BUAT KEMBALI RANKING VIEW
CREATE OR REPLACE VIEW public.participant_ranking_view AS
SELECT
  psv.*,
  RANK() OVER (
    ORDER BY psv.total_score DESC, psv.salat_score DESC
  ) AS ranking
FROM public.participant_scores_view psv
WHERE psv.score_status = 'selesai';
