import { createClient } from '@/lib/supabase/client'

export type AuditAction =
  | 'create_participant'
  | 'update_participant'
  | 'delete_participant'
  | 'create_score'
  | 'update_score'
  | 'finalize_score'
  | 'unlock_score'
  | 'reset_score'
  | 'finalize_results'
  | 'reopen_results'
  | 'create_judge'
  | 'update_judge'
  | 'delete_judge'

interface AuditPayload {
  action: AuditAction
  entityType: string
  entityId?: string
  participantId?: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
}

export async function logAudit(payload: AuditPayload): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    participant_id: payload.participantId ?? null,
    action: payload.action,
    entity_type: payload.entityType,
    entity_id: payload.entityId ?? null,
    old_value: payload.oldValue ? JSON.stringify(payload.oldValue) : null,
    new_value: payload.newValue ? JSON.stringify(payload.newValue) : null,
  })
}

export interface AuditLog {
  id: string
  user_id: string | null
  participant_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  created_at: string
  profiles?: { full_name: string | null; username: string | null }
  participants?: { participant_number: string } | null
}

export async function getAuditLogs(page = 0, pageSize = 50): Promise<{
  data: AuditLog[]
  count: number
}> {
  const supabase = createClient()
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('audit_logs')
    .select(
      `
      *,
      profiles (full_name, username),
      participants (participant_number)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { data: [], count: 0 }
  return { data: (data ?? []) as AuditLog[], count: count ?? 0 }
}

export const auditActionLabel: Record<string, string> = {
  create_participant: 'Tambah peserta',
  update_participant: 'Ubah peserta',
  delete_participant: 'Hapus peserta',
  create_score: 'Buat penilaian',
  update_score: 'Ubah nilai',
  finalize_score: 'Finalisasi nilai',
  unlock_score: 'Buka kembali nilai',
  reset_score: 'Reset nilai',
  finalize_results: 'Finalisasi hasil lomba',
  reopen_results: 'Buka kembali hasil',
  create_judge: 'Tambah juri',
  update_judge: 'Ubah juri',
  delete_judge: 'Hapus juri',
}
