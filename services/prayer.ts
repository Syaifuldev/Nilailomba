import { createClient } from '@/lib/supabase/client'
import type { PrayerScoreGroup, PrayerScore, ScoreStatus, ApiResponse } from '@/types'

// ─── Get all prayer score groups ──────────────────────────────────────────────
export async function getPrayerScoreGroups(): Promise<PrayerScoreGroup[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prayer_score_groups')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getPrayerScoreGroups error:', error.message)
    return []
  }
  return data ?? []
}

// ─── Get prayer scores for a participant + judge ───────────────────────────────
export async function getPrayerScores(
  participantId: string,
  judgeId: string
): Promise<PrayerScore[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prayer_scores')
    .select('*')
    .eq('participant_id', participantId)
    .eq('judge_id', judgeId)

  if (error) {
    console.error('getPrayerScores error:', error.message)
    return []
  }
  return data ?? []
}

// ─── Upsert a single prayer score ────────────────────────────────────────────
export async function upsertPrayerScore(payload: {
  participant_id: string
  judge_id: string
  group_id: string
  error_count: number
  score: number
  notes?: string
  status: ScoreStatus
}): Promise<ApiResponse<PrayerScore>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('prayer_scores')
    .upsert(
      {
        participant_id: payload.participant_id,
        judge_id: payload.judge_id,
        group_id: payload.group_id,
        error_count: payload.error_count,
        score: payload.score,
        notes: payload.notes ?? null,
        status: payload.status,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'participant_id,judge_id,group_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Save all prayer scores (status → 'saved') ────────────────────────────────
export async function savePrayerScores(
  participantId: string,
  judgeId: string
): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('prayer_scores')
    .update({ status: 'saved', updated_at: new Date().toISOString() })
    .eq('participant_id', participantId)
    .eq('judge_id', judgeId)
    .neq('status', 'finalized')

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Finalize all prayer scores ───────────────────────────────────────────────
export async function finalizePrayerScores(
  participantId: string,
  judgeId: string
): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('prayer_scores')
    .update({ status: 'finalized', updated_at: new Date().toISOString() })
    .eq('participant_id', participantId)
    .eq('judge_id', judgeId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Unlock finalized prayer scores (admin only) ──────────────────────────────
export async function unlockPrayerScores(
  participantId: string,
  judgeId: string
): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('prayer_scores')
    .update({ status: 'saved', updated_at: new Date().toISOString() })
    .eq('participant_id', participantId)
    .eq('judge_id', judgeId)
    .eq('status', 'finalized')

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Delete all prayer scores (admin / reset) ─────────────────────────────────
export async function deletePrayerScores(
  participantId: string,
  judgeId: string
): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('prayer_scores')
    .delete()
    .eq('participant_id', participantId)
    .eq('judge_id', judgeId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
