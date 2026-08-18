import { createClient } from '@/lib/supabase/client'
import type { CompetitionSettings, CompetitionSettingsFormData, ApiResponse } from '@/types'

// ─── Get settings (singleton) ─────────────────────────────────────────────────
export async function getCompetitionSettings(): Promise<ApiResponse<CompetitionSettings>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('competition_settings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Update settings ──────────────────────────────────────────────────────────
export async function updateCompetitionSettings(
  id: string,
  formData: Partial<CompetitionSettingsFormData>
): Promise<ApiResponse<CompetitionSettings>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('competition_settings')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Get dashboard stats ──────────────────────────────────────────────────────
export async function getDashboardStats() {
  const supabase = createClient()

  const [participantsResult, judgesResult] = await Promise.all([
    supabase.from('participants').select('id, status', { count: 'exact' }),
    supabase.from('judges').select('id, status', { count: 'exact' }),
  ])

  const totalParticipants = participantsResult.count ?? 0
  const totalJudges = judgesResult.count ?? 0
  const activeJudges = judgesResult.data?.filter((j) => j.status).length ?? 0

  return {
    total_participants: totalParticipants,
    total_judges: totalJudges,
    active_judges: activeJudges,
    // Placeholder until scoring module is built
    participants_not_assessed: totalParticipants,
    participants_in_progress: 0,
    participants_done: 0,
    participants_final: 0,
  }
}
