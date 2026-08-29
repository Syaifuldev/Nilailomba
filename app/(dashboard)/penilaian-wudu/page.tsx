'use client'

import { useEffect, useState, useCallback } from 'react'
import { Droplets, Lock, AlertCircle, UserX, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useWuduScoring } from '@/hooks/useWuduScoring'
import { getJudgeByUserId } from '@/services/wudu'
import { getParticipants } from '@/services/participants'
import { getJudges } from '@/services/judges'
import ParticipantSelector from '@/components/scoring/ParticipantSelector'
import ScoreInput from '@/components/scoring/ScoreInput'
import StickyTotal from '@/components/scoring/StickyTotal'
import FinalizeModal from '@/components/scoring/FinalizeModal'
import { ConfirmModal } from '@/components/ui/Modal'
import { PageLoading } from '@/components/ui/Loading'
import Select from '@/components/ui/Select'
import type { Participant, Judge } from '@/types'

export default function PenilaianWuduPage() {
  const { user, isAdmin } = useAuth()

  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [currentJudge, setCurrentJudge] = useState<Judge | null>(null)
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null) // for admin
  const [allJudges, setAllJudges] = useState<Judge[]>([]) // for admin
  const [pageLoading, setPageLoading] = useState(true)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  // Active judge ID: juri uses their own, admin can select
  const activeJudgeId = isAdmin ? selectedJudgeId : currentJudge?.id ?? null

  const scoring = useWuduScoring(activeJudgeId, selectedParticipant?.id ?? null)

  // ─── Init: load participants and resolve judge ─────────────────────────────
  useEffect(() => {
    async function init() {
      if (!user) return
      setPageLoading(true)

      const resp = await getParticipants()
      const sorted = (resp.data ?? []).sort((a, b) =>
        a.participant_number.localeCompare(b.participant_number)
      )
      setParticipants(sorted)

      if (isAdmin) {
        // Admin: load all judges with wudu access
        const judgesResp = await getJudges()
        const judges = judgesResp.data ?? []
        const wuduJudges = judges
        setAllJudges(wuduJudges)
        if (wuduJudges.length > 0) setSelectedJudgeId(wuduJudges[0].id)
      } else {
        // Juri: find their judge record
        const judge = await getJudgeByUserId(user.id)
        if (!judge) {
          setAccessError(
            'Akun Anda belum terdaftar sebagai juri aktif. Hubungi Admin untuk mendaftarkan akun Anda ke daftar juri.'
          )
          setPageLoading(false)
          return
        }
        // Restriction removed: Juri can score all competitions
        setCurrentJudge(judge)
      }

      setPageLoading(false)
    }
    init()
  }, [user, isAdmin])

  const handleSave = useCallback(async () => {
    await scoring.saveAll()
  }, [scoring])

  const handleDraft = useCallback(async () => {
    // Draft is already auto-saved, just show toast
    import('react-hot-toast').then(({ default: toast }) => {
      toast.success('Draft tersimpan (auto-save aktif)')
    })
  }, [])

  const handleFinalize = useCallback(async () => {
    await scoring.finalizeAll()
    setShowFinalizeModal(false)
  }, [scoring])

  const handleUnlock = useCallback(async () => {
    await scoring.unlockAll()
  }, [scoring])

  const handleReset = useCallback(async () => {
    await scoring.resetAll()
    setShowResetModal(false)
  }, [scoring])

  // ─── Access denied / page loading ─────────────────────────────────────────
  if (pageLoading) return <PageLoading />

  if (accessError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Akses Ditolak</h3>
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm">{accessError}</p>
      </div>
    )
  }

  const judgeName = isAdmin
    ? allJudges.find((j) => j.id === selectedJudgeId)?.judge_name ?? '—'
    : currentJudge?.judge_name ?? user?.profile?.full_name ?? user?.email ?? '—'

  const isReadOnly = scoring.isFinalized && !isAdmin

  return (
    <div className="space-y-4 pb-36">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
          <Droplets className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Penilaian Praktik Wudu</h2>
          <p className="text-xs text-slate-400">Nilai Maksimal: 100</p>
        </div>
      </div>

      {/* ─── Participant + Judge Info Card ───────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        {/* Judge selector (admin only) */}
        {isAdmin && allJudges.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Juri</label>
            <Select
              id="admin-judge-select"
              value={selectedJudgeId ?? ''}
              onChange={(e) => setSelectedJudgeId(e.target.value || null)}
              options={allJudges.map((j) => ({
                value: j.id,
                label: `${j.judge_name} (${j.judging_category})`,
              }))}
            />
          </div>
        )}

        {/* Participant selector */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Nomor Peserta
          </label>
          <ParticipantSelector
            participants={participants}
            selectedId={selectedParticipant?.id ?? null}
            onSelect={setSelectedParticipant}
          />
        </div>

        {/* Info row */}
        {selectedParticipant && (
          <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400">Nomor Peserta</p>
              <p className="text-xl font-bold font-mono text-blue-700 tracking-widest">
                {selectedParticipant.participant_number}
              </p>
            </div>
            {selectedParticipant.gender && (
              <div>
                <p className="text-xs text-slate-400">Jenis Kelamin</p>
                <p className={`text-sm font-semibold ${
                  selectedParticipant.gender === 'laki-laki' ? 'text-sky-700' : 'text-pink-600'
                }`}>
                  {selectedParticipant.gender === 'laki-laki' ? '♂ Laki-laki' : '♀ Perempuan'}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">Nama Juri</p>
              <p className="text-sm font-semibold text-slate-900">{judgeName}</p>
            </div>
            {scoring.isFinalized && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Lock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600">Nilai Terkunci</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── No Participant Selected ─────────────────────────────────── */}
      {!selectedParticipant && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
          <Droplets className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Pilih Nomor Peserta</p>
          <p className="text-xs text-slate-400 mt-1">Gunakan dropdown di atas untuk memilih peserta</p>
        </div>
      )}

      {/* ─── No Participants in DB ───────────────────────────────────── */}
      {participants.length === 0 && !pageLoading && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Belum ada peserta. Minta Admin/Operator untuk menambahkan data peserta terlebih dahulu.
          </p>
        </div>
      )}

      {/* ─── Scoring Table ───────────────────────────────────────────── */}
      {selectedParticipant && !scoring.loading && scoring.rows.length > 0 && (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-8">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Aspek yang Dinilai</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Maks</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-44">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scoring.rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      row.status === 'finalized' ? 'bg-slate-50/80' : 'hover:bg-blue-50/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-400 font-medium text-center">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-800 font-medium">{row.criteria_name}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center h-6 w-10 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                        {row.maximum_score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <ScoreInput
                          id={`wudu-score-${row.id}`}
                          value={row.score}
                          maxValue={row.maximum_score}
                          disabled={isReadOnly}
                          onChange={(v) => scoring.updateScore(row.id, v, row.notes)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Total row */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-blue-50">
                  <td colSpan={2} className="px-4 py-3">
                    <span className="font-bold text-slate-700">TOTAL</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-slate-600">100</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xl font-extrabold ${scoring.totalScore > 100 ? 'text-red-600' : 'text-blue-700'}`}>
                      {scoring.totalScore}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {scoring.rows.map((row, idx) => (
              <div
                key={row.id}
                className={`rounded-2xl border p-4 space-y-3 ${
                  row.status === 'finalized'
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{row.criteria_name}</span>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-500">
                    Maks: <span className="font-bold text-blue-600">{row.maximum_score}</span>
                  </span>
                </div>
                <ScoreInput
                  id={`wudu-score-mobile-${row.id}`}
                  value={row.score}
                  maxValue={row.maximum_score}
                  disabled={isReadOnly}
                  onChange={(v) => scoring.updateScore(row.id, v, row.notes)}
                />
              </div>
            ))}

            {/* Mobile total card */}
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-blue-800">TOTAL NILAI WUDU</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${scoring.totalScore > 100 ? 'text-red-600' : 'text-blue-700'}`}>
                    {scoring.totalScore}
                  </span>
                  <span className="text-slate-500 font-medium">/ 100</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading state */}
      {selectedParticipant && scoring.loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* ─── Sticky Total + Action Buttons ───────────────────────────── */}
      <StickyTotal
        totalScore={scoring.totalScore}
        maxScore={100}
        isFinalized={scoring.isFinalized}
        isAdmin={isAdmin}
        overallStatus={scoring.overallStatus}
        actionLoading={scoring.actionLoading}
        hasParticipant={!!selectedParticipant}
        onDraft={handleDraft}
        onSave={handleSave}
        onFinalize={() => setShowFinalizeModal(true)}
        onUnlock={handleUnlock}
        onReset={() => setShowResetModal(true)}
      />

      {/* ─── Modals ───────────────────────────────────────────────────── */}
      <FinalizeModal
        open={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        onConfirm={handleFinalize}
        totalScore={scoring.totalScore}
        maxScore={100}
        participantNumber={selectedParticipant?.participant_number ?? '—'}
        loading={scoring.actionLoading}
      />

      <ConfirmModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="Reset Nilai Wudu"
        description={`Apakah Anda yakin ingin menghapus semua nilai wudu peserta ${selectedParticipant?.participant_number ?? ''}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Reset"
        loading={scoring.actionLoading}
      />
    </div>
  )
}
