import { createClient } from '@/lib/supabase/client'
import type { ApiResponse } from '@/types'
import type { RankedParticipant } from './scoring-calc'

export interface CompetitionResult {
  id: string
  participant_id: string
  final_wudu_score: number
  final_prayer_score: number
  total_score: number
  percentage: number
  ranking: number | null
  result_status: 'draft' | 'published'
  finalized_at: string | null
  finalized_by: string | null
  created_at: string
  updated_at: string
}

// ─── Get all results ──────────────────────────────────────────────────────────
export async function getCompetitionResults(): Promise<CompetitionResult[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('competition_results')
    .select('*')
    .order('ranking', { ascending: true })

  if (error) return []
  return data ?? []
}

// ─── Upsert a result ──────────────────────────────────────────────────────────
export async function upsertCompetitionResult(
  result: Omit<CompetitionResult, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<CompetitionResult>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('competition_results')
    .upsert(result, { onConflict: 'participant_id' })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Finalize: snapshot current ranking into competition_results ──────────────
export async function finalizeCompetitionResults(
  rankedParticipants: RankedParticipant[],
  userId: string
): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const now = new Date().toISOString()

  const rows = rankedParticipants.map((r) => ({
    participant_id: r.participant_id,
    final_wudu_score: r.wudu_score,
    final_prayer_score: r.salat_score,
    total_score: r.total_score,
    percentage: r.percentage,
    ranking: r.ranking,
    result_status: 'published' as const,
    finalized_at: now,
    finalized_by: userId,
  }))

  const { error } = await supabase
    .from('competition_results')
    .upsert(rows, { onConflict: 'participant_id' })

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Check if results are published ──────────────────────────────────────────
export async function isResultsPublished(): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('competition_results')
    .select('id')
    .eq('result_status', 'published')
    .limit(1)

  return (data?.length ?? 0) > 0
}

// ─── Reopen (set back to draft) ───────────────────────────────────────────────
export async function reopenCompetitionResults(): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('competition_results')
    .update({ result_status: 'draft', finalized_at: null })
    .eq('result_status', 'published')

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
