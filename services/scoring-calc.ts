import { createClient } from '@/lib/supabase/client'
import type { ApiResponse, Gender } from '@/types'

export interface ParticipantScore {
  participant_id: string
  participant_number: string
  gender: Gender
  wudu_score: number
  salat_score: number
  total_score: number
  percentage: number
  wudu_judge_count: number
  salat_judge_count: number
  score_status: 'belum' | 'sebagian' | 'selesai'
}

export interface RankedParticipant extends ParticipantScore {
  ranking: number
}

// ─── Get all participant scores (from view + gender join) ─────────────────────────────
export async function getParticipantScores(): Promise<ParticipantScore[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('participant_scores_view')
    .select('*')
    .order('participant_number', { ascending: true })

  if (error) {
    console.error('getParticipantScores error:', error.message)
    return []
  }

  // Enrich with gender from participants table
  const ids = (data ?? []).map((d: any) => d.participant_id)
  const { data: participantsData } = await supabase
    .from('participants')
    .select('id, gender')
    .in('id', ids)

  const genderMap = new Map((participantsData ?? []).map((p: any) => [p.id, p.gender]))

  return (data ?? []).map((d: any) => ({
    ...d,
    gender: genderMap.get(d.participant_id) ?? null,
  })) as ParticipantScore[]
}

// ─── Get ranked participants (finalized only) ─────────────────────────────────────────────────────
export async function getRankedParticipants(): Promise<RankedParticipant[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('participant_ranking_view')
    .select('*')
    .order('ranking', { ascending: true })

  if (error) {
    console.error('getRankedParticipants error:', error.message)
    return []
  }

  // Enrich with gender from participants table
  const ids = (data ?? []).map((d: any) => d.participant_id)
  const { data: participantsData } = await supabase
    .from('participants')
    .select('id, gender')
    .in('id', ids)

  const genderMap = new Map((participantsData ?? []).map((p: any) => [p.id, p.gender]))

  return (data ?? []).map((d: any) => ({
    ...d,
    gender: genderMap.get(d.participant_id) ?? null,
  })) as RankedParticipant[]
}

// ─── Get score for a single participant ──────────────────────────────────────
export async function getParticipantScore(
  participantId: string
): Promise<ParticipantScore | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('participant_scores_view')
    .select('*')
    .eq('participant_id', participantId)
    .single()

  if (error) return null
  return data as ParticipantScore
}

// ─── Get judge-level breakdown for a participant ──────────────────────────────
export async function getJudgeBreakdown(participantId: string) {
  const supabase = createClient()

  const [wuduRes, salatRes] = await Promise.all([
    supabase
      .from('wudu_scores')
      .select('judge_id, score, status, judges(judge_name, judging_category)')
      .eq('participant_id', participantId)
      .eq('status', 'finalized'),
    supabase
      .from('prayer_scores')
      .select('judge_id, score, status, judges(judge_name, judging_category)')
      .eq('participant_id', participantId)
      .eq('status', 'finalized'),
  ])

  // Aggregate wudu per judge
  const wuduByJudge = new Map<string, { name: string; total: number }>()
  for (const row of wuduRes.data ?? []) {
    const judgeId = row.judge_id
    if (!wuduByJudge.has(judgeId)) {
      wuduByJudge.set(judgeId, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: (row as any).judges?.judge_name ?? judgeId,
        total: 0,
      })
    }
    wuduByJudge.get(judgeId)!.total += row.score
  }

  const salatByJudge = new Map<string, { name: string; total: number }>()
  for (const row of salatRes.data ?? []) {
    const judgeId = row.judge_id
    if (!salatByJudge.has(judgeId)) {
      salatByJudge.set(judgeId, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: (row as any).judges?.judge_name ?? judgeId,
        total: 0,
      })
    }
    salatByJudge.get(judgeId)!.total += row.score
  }

  const wuduEntries = Array.from(wuduByJudge.entries()).map(([id, v]) => ({
    judgeId: id,
    judgeName: v.name,
    total: v.total,
  }))
  const salatEntries = Array.from(salatByJudge.entries()).map(([id, v]) => ({
    judgeId: id,
    judgeName: v.name,
    total: v.total,
  }))

  const wuduTotalSum =
    wuduEntries.length > 0
      ? wuduEntries.reduce((s, e) => s + e.total, 0)
      : 0
  const salatTotalSum =
    salatEntries.length > 0
      ? salatEntries.reduce((s, e) => s + e.total, 0)
      : 0
      
  const wuduJudgesCount = wuduEntries.length
  const salatJudgesCount = salatEntries.length
  const maxPossible = (wuduJudgesCount * 100) + (salatJudgesCount * 250)

  return {
    wuduJudges: wuduEntries,
    salatJudges: salatEntries,
    wuduAverage: wuduTotalSum, // Kept the key name for compatibility, but it's now sum
    salatAverage: salatTotalSum,
    total: wuduTotalSum + salatTotalSum,
    percentage: maxPossible > 0 ? Math.round(((wuduTotalSum + salatTotalSum) / maxPossible) * 10000) / 100 : 0,
  }
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export interface ScoringStats {
  total: number
  belum: number
  sebagian: number
  selesai: number
  wudu_done: number
  salat_done: number
  highest: number
  lowest: number
  average: number
  top10: RankedParticipant[]
}

export async function getScoringStats(): Promise<ScoringStats> {
  const [scores, ranked] = await Promise.all([
    getParticipantScores(),
    getRankedParticipants(),
  ])

  const belum = scores.filter((s) => s.score_status === 'belum').length
  const sebagian = scores.filter((s) => s.score_status === 'sebagian').length
  const selesai = scores.filter((s) => s.score_status === 'selesai').length

  // Count wudu done: participants that have at least one finalized wudu score
  const wudu_done = scores.filter((s) => s.wudu_judge_count > 0).length
  const salat_done = scores.filter((s) => s.salat_judge_count > 0).length

  const totals = ranked.map((r) => r.total_score)
  const highest = totals.length > 0 ? Math.max(...totals) : 0
  const lowest = totals.length > 0 ? Math.min(...totals) : 0
  const average =
    totals.length > 0
      ? Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 100) / 100
      : 0

  return {
    total: scores.length,
    belum,
    sebagian,
    selesai,
    wudu_done,
    salat_done,
    highest,
    lowest,
    average,
    top10: ranked.slice(0, 10),
  }
}

// ────────────────────────────────────────────────────────────
// Reset all scores
// ────────────────────────────────────────────────────────────
export async function resetAllScores(): Promise<ApiResponse<null>> {
  const supabase = createClient()
  
  const [res1, res2] = await Promise.all([
    supabase.from('wudu_scores').delete().not('id', 'is', null),
    supabase.from('prayer_scores').delete().not('id', 'is', null)
  ])

  if (res1.error) return { data: null, error: res1.error.message }
  if (res2.error) return { data: null, error: res2.error.message }

  return { data: null, error: null }
}
