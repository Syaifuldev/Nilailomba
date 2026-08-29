import { createClient } from '@/lib/supabase/client'
import type { Participant, ParticipantFormData, ApiResponse, Gender } from '@/types'

// ─── Get all participants ───────────────────────────────────────────────────────
export async function getParticipants(): Promise<ApiResponse<Participant[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('participants')
    .select(`
      *,
      wudu_scores(id, status),
      prayer_scores(id, status)
    `)
    .order('participant_number', { ascending: true })

  if (error) return { data: null, error: error.message }

  // Compute assessment_status from scores
  const mapped = (data ?? []).map((p: any) => {
    const wuduScores: { id: string; status: string }[] = p.wudu_scores ?? []
    const prayerScores: { id: string; status: string }[] = p.prayer_scores ?? []

    const hasWudu = wuduScores.length > 0
    const hasPrayer = prayerScores.length > 0
    const wuduFinalized = hasWudu && wuduScores.every((s) => s.status === 'finalized')
    const prayerFinalized = hasPrayer && prayerScores.every((s) => s.status === 'finalized')
    const wuduSaved = hasWudu && wuduScores.some((s) => s.status === 'saved' || s.status === 'finalized')
    const prayerSaved = hasPrayer && prayerScores.some((s) => s.status === 'saved' || s.status === 'finalized')

    let assessment_status: Participant['assessment_status'] = 'belum_dinilai'
    if (wuduFinalized && prayerFinalized) {
      assessment_status = 'selesai'
    } else if (wuduFinalized || prayerFinalized) {
      assessment_status = 'sebagian_selesai'
    } else if (wuduSaved || prayerSaved) {
      assessment_status = 'sedang_dinilai'
    }

    const { wudu_scores: _w, prayer_scores: _pr, ...rest } = p
    return { ...rest, assessment_status } as Participant
  })

  return { data: mapped, error: null }
}

// ─── Get single participant ───────────────────────────────────────────────────
export async function getParticipant(id: string): Promise<ApiResponse<Participant>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Create participant ───────────────────────────────────────────────────────
export async function createParticipant(
  formData: ParticipantFormData
): Promise<ApiResponse<Participant>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('participants')
    .insert(formData)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Update participant ───────────────────────────────────────────────────────
export async function updateParticipant(
  id: string,
  formData: Partial<ParticipantFormData>
): Promise<ApiResponse<Participant>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('participants')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Delete participant ───────────────────────────────────────────────────────
export async function deleteParticipant(id: string): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Bulk delete participants ──────────────────────────────────────────────────
export async function deleteParticipants(ids: string[]): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('participants')
    .delete()
    .in('id', ids)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Generate participants in bulk ────────────────────────────────────────────
export async function generateParticipants(
  count: number,
  startFrom: number = 1
): Promise<ApiResponse<Participant[]>> {
  const supabase = createClient()

  const participants = []
  for (let i = startFrom; i < startFrom + count; i++) {
    participants.push({
      participant_number: String(i).padStart(3, '0'),
      status: 'active' as const,
    })
  }

  const { data, error } = await supabase
    .from('participants')
    .insert(participants)
    .select()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Bulk import participants ─────────────────────────────────────────────────
export async function importParticipants(
  numbers: string[]
): Promise<ApiResponse<{ inserted: number; skipped: number }>> {
  const supabase = createClient()

  const participants = numbers.map((num) => ({
    participant_number: num.trim().padStart(3, '0'),
    status: 'active' as const,
  }))

  // Use upsert to skip duplicates
  const { data, error } = await supabase
    .from('participants')
    .upsert(participants, {
      onConflict: 'participant_number',
      ignoreDuplicates: true,
    })
    .select()

  if (error) return { data: null, error: error.message }

  return {
    data: {
      inserted: data?.length ?? 0,
      skipped: participants.length - (data?.length ?? 0),
    },
    error: null,
  }
}

// ─── Check if participant number exists ───────────────────────────────────────
export async function checkParticipantNumberExists(
  number: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = createClient()
  let query = supabase
    .from('participants')
    .select('id')
    .eq('participant_number', number)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.maybeSingle()
  return !!data
}
