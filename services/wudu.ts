import { createClient } from '@/lib/supabase/client'
import type { WuduCriteria, WuduScore, ScoreStatus, ApiResponse } from '@/types'

// ─── Get all wudu criteria ─────────────────────────────────────────────────────
export async function getWuduCriteria(): Promise<WuduCriteria[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wudu_criteria')
    .select('*')
    .order('criteria_number', { ascending: true })

  if (error) {
    console.error('getWuduCriteria error:', error.message)
    return []
  }
  return data ?? []
}

// ─── Get wudu scores for a participant + judge ─────────────────────────────────
export async function getWuduScores(
  participantId: string,
  judgeId: string
): Promise<WuduScore[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wudu_scores')
    .select('*')
    .eq('participant_id', participantId)
    .eq('judge_id', judgeId)

  if (error) {
    console.error('getWuduScores error:', error.message)
    return []
  }
  return data ?? []
}

// ─── Upsert a single wudu score ───────────────────────────────────────────────
export async function upsertWuduScore(payload: {
  participant_id: string
  judge_id: string
  criteria_id: string
  score: number
  notes?: string
  status: ScoreStatus
}): Promise<ApiResponse<WuduScore>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wudu_scores')
    .upsert(
      {
        participant_id: payload.participant_id,
        judge_id: payload.judge_id,
        criteria_id: payload.criteria_id,
        score: payload.score,
        notes: payload.notes ?? null,
        status: payload.status,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'participant_id,judge_id,criteria_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Save all wudu scores (change status to 'saved') ─────────────────────────
export async function saveWuduScores(
  participantId: string,
  judgeId: string
): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('wudu_scores')
    .update({ status: 'saved', updated_at: new Date().toISOString() })
    .eq('participant_id', participantId)
    .eq('judge_id', judgeId)
    .neq('status', 'finalized')

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Finalize all wudu scores ─────────────────────────────────────────────────
export async function finalizeWuduScores(
  participantId: string,
  judgeId: string
): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('wudu_scores')
    .update({ status: 'finalized', updated_at: new Date().toISOString() })
    .eq('participant_id', participantId)
    .eq('judge_id', judgeId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Unlock finalized scores (admin only) ────────────────────────────────────
export async function unlockWuduScores(
  participantId: string,
  judgeId: string
): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('wudu_scores')
    .update({ status: 'saved', updated_at: new Date().toISOString() })
    .eq('participant_id', participantId)
    .eq('judge_id', judgeId)
    .eq('status', 'finalized')

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Delete all wudu scores (admin / reset) ──────────────────────────────────
export async function deleteWuduScores(
  participantId: string,
  judgeId: string
): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('wudu_scores')
    .delete()
    .eq('participant_id', participantId)
    .eq('judge_id', judgeId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Get all participant IDs that have wudu scores for a judge ───────────────
export async function getWuduScoredParticipantIds(judgeId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wudu_scores')
    .select('participant_id, status')
    .eq('judge_id', judgeId)

  if (error) return []
  // Return unique participant IDs that have at least one score record
  const ids = new Set<string>((data ?? []).map((r) => r.participant_id))
  return Array.from(ids)
}

// ─── Get all participant IDs that have finalized wudu scores for a judge ──────
export async function getWuduFinalizedParticipantIds(judgeId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wudu_scores')
    .select('participant_id')
    .eq('judge_id', judgeId)
    .eq('status', 'finalized')

  if (error) return []
  const ids = new Set<string>((data ?? []).map((r) => r.participant_id))
  return Array.from(ids)
}

// ─── Get judge record by user auth id ────────────────────────────────────────
export async function getJudgeByUserId(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .eq('user_id', userId)
    .eq('status', true)
    .maybeSingle()

  if (error) return null
  return data
}
