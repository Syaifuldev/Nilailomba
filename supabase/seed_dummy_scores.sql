-- Script untuk membuat data nilai dummy (Wudu dan Salat) untuk 28 peserta pertama
-- Jalankan script ini di menu "SQL Editor" pada dashboard Supabase Anda.

DO $$
DECLARE
    p RECORD;
    j RECORD;
    cw RECORD;
    cs RECORD;
    wudu_val INT;
    salat_val INT;
BEGIN
    -- Ambil maksimal 28 peserta yang berstatus aktif
    FOR p IN (SELECT id FROM public.participants WHERE status = 'active' ORDER BY participant_number ASC LIMIT 28) 
    LOOP
        -- Looping untuk semua juri yang terdaftar
        FOR j IN (SELECT id FROM public.judges)
        LOOP
            -- Looping untuk setiap kriteria Wudu
            FOR cw IN (SELECT id, maximum_score FROM public.wudu_criteria)
            LOOP
                -- Asumsikan nilai acak: Minimal 50% dari maximum_score, maksimal = maximum_score
                wudu_val := floor(random() * (cw.maximum_score / 2 + 1) + (cw.maximum_score / 2));
                
                IF NOT EXISTS (SELECT 1 FROM public.wudu_scores WHERE participant_id = p.id AND judge_id = j.id AND criteria_id = cw.id) THEN
                    INSERT INTO public.wudu_scores (participant_id, judge_id, criteria_id, score, status)
                    VALUES (p.id, j.id, cw.id, wudu_val, 'finalized');
                ELSE
                    UPDATE public.wudu_scores 
                    SET score = wudu_val, status = 'finalized' 
                    WHERE participant_id = p.id AND judge_id = j.id AND criteria_id = cw.id;
                END IF;
            END LOOP;
            
            -- Looping untuk setiap grup kriteria Salat
            FOR cs IN (SELECT id, maximum_score FROM public.prayer_score_groups)
            LOOP
                salat_val := floor(random() * (cs.maximum_score / 2 + 1) + (cs.maximum_score / 2));
                
                IF NOT EXISTS (SELECT 1 FROM public.prayer_scores WHERE participant_id = p.id AND judge_id = j.id AND group_id = cs.id) THEN
                    INSERT INTO public.prayer_scores (participant_id, judge_id, group_id, score, error_count, status)
                    VALUES (p.id, j.id, cs.id, salat_val, 0, 'finalized');
                ELSE
                    UPDATE public.prayer_scores 
                    SET score = salat_val, error_count = 0, status = 'finalized' 
                    WHERE participant_id = p.id AND judge_id = j.id AND group_id = cs.id;
                END IF;
            END LOOP;
            
        END LOOP;
    END LOOP;
END $$;
