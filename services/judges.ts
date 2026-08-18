import { createClient } from '@/lib/supabase/client'
import type { Judge, JudgeFormData, ApiResponse, Profile } from '@/types'

// ─── Get all judges ───────────────────────────────────────────────────────────
export async function getJudges(): Promise<ApiResponse<Judge[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('judges')
    .select(`
      *,
      profile:profiles(id, username, full_name, role)
    `)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Get all juri profiles ───────────────────────────────────────────────────
export async function getJuriProfiles(): Promise<ApiResponse<Profile[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'juri')
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Get single judge ─────────────────────────────────────────────────────────
export async function getJudge(id: string): Promise<ApiResponse<Judge>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('judges')
    .select(`
      *,
      profile:profiles(id, username, full_name, role)
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Create judge (judge record only) ────────────────────────────────────────
export async function createJudge(
  formData: Omit<JudgeFormData, 'email' | 'password' | 'username'>
): Promise<ApiResponse<Judge>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('judges')
    .insert({
      user_id: formData.user_id || null,
      judge_name: formData.judge_name,
      judging_category: formData.judging_category,
      status: formData.status,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Update judge ─────────────────────────────────────────────────────────────
export async function updateJudge(
  id: string,
  formData: Partial<Omit<JudgeFormData, 'email' | 'password' | 'username'>>
): Promise<ApiResponse<Judge>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('judges')
    .update({
      user_id: formData.user_id || null,
      judge_name: formData.judge_name,
      judging_category: formData.judging_category,
      status: formData.status,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Delete judge ─────────────────────────────────────────────────────────────
export async function deleteJudge(id: string): Promise<ApiResponse<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('judges')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

// ─── Toggle judge status ──────────────────────────────────────────────────────
export async function toggleJudgeStatus(
  id: string,
  status: boolean
): Promise<ApiResponse<Judge>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('judges')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Get judges by category ───────────────────────────────────────────────────
export async function getJudgesByCategory(category: string): Promise<ApiResponse<Judge[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('judges')
    .select('*')
    .or(`judging_category.eq.${category},judging_category.eq.wudu_dan_salat`)
    .eq('status', true)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
