export type UserRole = 'admin' | 'juri' | 'operator'

export type JudgingCategory = 'wudu' | 'salat' | 'wudu_dan_salat'

export type ParticipantStatus = 'active' | 'inactive'

export type CompetitionStatus = 'draft' | 'active' | 'completed'

export type ScoringMethod = 'total' | 'average' | 'weighted'

export type ScoreStatus = 'draft' | 'saved' | 'finalized'

// ─── Profile ──────────────────────────────────────────────────────────────────
export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

// ─── Judge ────────────────────────────────────────────────────────────────────
export interface Judge {
  id: string
  user_id: string | null
  judge_name: string
  judging_category: JudgingCategory
  status: boolean
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface JudgeWithEmail extends Judge {
  email?: string
}

// ─── Participant ───────────────────────────────────────────────────────────────
export interface Participant {
  id: string
  participant_number: string
  status: ParticipantStatus
  created_at: string
  updated_at: string
  assessment_status?: AssessmentStatus
}

export type AssessmentStatus =
  | 'belum_dinilai'
  | 'sedang_dinilai'
  | 'sebagian_selesai'
  | 'selesai'
  | 'final'

// ─── Competition Settings ──────────────────────────────────────────────────────
export interface CompetitionSettings {
  id: string
  competition_name: string | null
  competition_year: string | null
  organizer_name: string | null
  competition_date: string | null
  scoring_method: ScoringMethod
  competition_status: CompetitionStatus
  logo_url: string | null
  created_at: string
  updated_at: string
}

// ─── Dashboard Stats ───────────────────────────────────────────────────────────
export interface DashboardStats {
  total_participants: number
  total_judges: number
  active_judges: number
  participants_not_assessed: number
  participants_in_progress: number
  participants_done: number
  participants_final: number
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string | null
  profile: Profile | null
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

// ─── Form States ──────────────────────────────────────────────────────────────
export interface ParticipantFormData {
  participant_number: string
  status: ParticipantStatus
}

export interface JudgeFormData {
  judge_name: string
  judging_category: JudgingCategory
  status: boolean
  user_id?: string | null
  email?: string
  password?: string
  username?: string
}

export interface CompetitionSettingsFormData {
  competition_name: string
  competition_year: string
  organizer_name: string
  competition_date: string
  scoring_method: ScoringMethod
  competition_status: CompetitionStatus
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// ─── Table Sort ───────────────────────────────────────────────────────────────
export type SortDirection = 'asc' | 'desc'

export interface SortState {
  column: string
  direction: SortDirection
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

// ─── Phase 2: Wudu Scoring ────────────────────────────────────────────────────

export interface WuduCriteria {
  id: string
  criteria_number: number
  criteria_name: string
  maximum_score: number
  created_at: string
}

export interface WuduScore {
  id: string
  participant_id: string
  judge_id: string
  criteria_id: string
  score: number
  notes: string | null
  status: ScoreStatus
  created_at: string
  updated_at: string
}

export interface WuduScoreRow extends WuduCriteria {
  score_id?: string
  score: number
  notes: string
  status: ScoreStatus
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

// ─── Phase 2: Prayer (Salat) Scoring ─────────────────────────────────────────

export interface PrayerScoreGroup {
  id: string
  group_code: string
  group_name: string
  criteria_numbers: number[]
  criteria_names: string[]
  maximum_score: number
  sort_order: number
  created_at: string
}

export interface PrayerScore {
  id: string
  participant_id: string
  judge_id: string
  group_id: string
  error_count: number
  score: number
  notes: string | null
  status: ScoreStatus
  created_at: string
  updated_at: string
}

export interface PrayerScoreRow extends PrayerScoreGroup {
  score_id?: string
  error_count: number
  score: number
  notes: string
  status: ScoreStatus
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

// ─── Participant Scoring Summary ───────────────────────────────────────────────

export interface ParticipantScoringSummary {
  participant_id: string
  participant_number: string
  wudu_status: ScoreStatus | 'belum'
  salat_status: ScoreStatus | 'belum'
  wudu_total: number
  salat_total: number
}
