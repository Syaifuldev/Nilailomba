'use client'

import { useEffect, useState, useCallback } from 'react'
import { Church, Lock, AlertCircle, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePrayerScoring } from '@/hooks/usePrayerScoring'
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

function ErrorInput({
  value,
  disabled,
  onChange,
  id,
  className
}: {
  value: number
  disabled: boolean
  onChange: (v: number) => void
  id: string
  className: string
}) {
  const [val, setVal] = useState(value.toString())
  useEffect(() => setVal(value.toString()), [value])

  return (
    <input
      type="number"
      min={0}
      value={val}
      disabled={disabled}
      onChange={(e) => setVal(e.target.value)}
      onBlur={(e) => {
        const n = parseInt(e.target.value)
        if (isNaN(n)) {
          setVal(value.toString())
        } else {
          const clamped = Math.max(0, n)
          setVal(clamped.toString())
          if (clamped !== value) onChange(clamped)
        }
      }}
      className={className}
      id={id}
    />
  )
}

const formatNumbers = (nums: number[]) => {
  if (!nums || nums.length === 0) return ''
  if (nums.length === 1) return nums[0].toString()
  return `${nums[0]} - ${nums[nums.length - 1]}`
}

export default function PenilaianSalatPage() {
  const { user, isAdmin } = useAuth()

  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [currentJudge, setCurrentJudge] = useState<Judge | null>(null)
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null)
  const [allJudges, setAllJudges] = useState<Judge[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  const activeJudgeId = isAdmin ? selectedJudgeId : currentJudge?.id ?? null
  const scoring = usePrayerScoring(activeJudgeId, selectedParticipant?.id ?? null)

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
        const judgesResp = await getJudges()
        const judges = judgesResp.data ?? []
        const salatJudges = judges
        setAllJudges(salatJudges)
        if (salatJudges.length > 0) setSelectedJudgeId(salatJudges[0].id)
      } else {
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

  const handleSave = useCallback(async () => { await scoring.saveAll() }, [scoring])
  const handleDraft = useCallback(async () => {
    import('react-hot-toast').then(({ default: toast }) => {
      toast.success('Draft tersimpan (auto-save aktif)')
    })
  }, [])
  const handleFinalize = useCallback(async () => {
    await scoring.finalizeAll()
    setShowFinalizeModal(false)
  }, [scoring])
  const handleUnlock = useCallback(async () => { await scoring.unlockAll() }, [scoring])
  const handleReset = useCallback(async () => {
    await scoring.resetAll()
    setShowResetModal(false)
  }, [scoring])

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
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
          <Church className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Penilaian Praktik Gerakan dan Bacaan Salat
          </h2>
          <p className="text-xs text-slate-400">Nilai Maksimal: 250</p>
        </div>
      </div>

      {/* Participant + Judge Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        {isAdmin && allJudges.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Juri</label>
            <Select
              id="admin-salat-judge-select"
              value={selectedJudgeId ?? ''}
              onChange={(e) => setSelectedJudgeId(e.target.value || null)}
              options={allJudges.map((j) => ({
                value: j.id,
                label: `${j.judge_name} (${j.judging_category})`,
              }))}
            />
          </div>
        )}

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

        {selectedParticipant && (
          <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-400">Nomor Peserta</p>
              <p className="text-xl font-bold font-mono text-purple-700 tracking-widest">
                {selectedParticipant.participant_number}
              </p>
            </div>
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

      {/* No participant */}
      {!selectedParticipant && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
          <Church className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Pilih Nomor Peserta</p>
          <p className="text-xs text-slate-400 mt-1">Gunakan dropdown di atas untuk memilih peserta</p>
        </div>
      )}

      {participants.length === 0 && !pageLoading && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Belum ada peserta. Minta Admin/Operator untuk menambahkan peserta terlebih dahulu.
          </p>
        </div>
      )}

      {/* ─── Scoring Table ─────────────────────────────────────────── */}
      {selectedParticipant && !scoring.loading && scoring.rows.length > 0 && (
        <>
          {/* Desktop: Table */}
          <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-12 whitespace-nowrap">No</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Aspek yang Dinilai</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Maks</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Jml Kesalahan</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-44">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scoring.rows.map((row, idx) => {
                  const criteriaList = row.criteria_names
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        row.status === 'finalized' ? 'bg-slate-50/80' : 'hover:bg-purple-50/20'
                      }`}
                    >
                      {/* Numbers */}
                      <td className="px-3 py-3 text-xs text-slate-400 font-medium text-center align-top pt-4 whitespace-nowrap">
                        {formatNumbers(row.criteria_numbers)}
                      </td>
                      {/* Criteria names */}
                      <td className="px-3 py-3 align-top">
                        <p className="text-xs font-semibold text-purple-700 mb-1">{row.group_name}</p>
                        <ul className="space-y-0.5">
                          {criteriaList.map((name, i) => (
                            <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                              <span className="text-slate-300 shrink-0">{row.criteria_numbers[i]}.</span>
                              <span>{name}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      {/* Max score */}
                      <td className="px-3 py-3 text-center align-top pt-4">
                        <span className="inline-flex items-center justify-center h-6 w-10 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs">
                          {row.maximum_score}
                        </span>
                      </td>
                      {/* Error count */}
                      <td className="px-3 py-3 align-top pt-4">
                        <div className="flex justify-center">
                          <ErrorInput
                            value={row.error_count}
                            disabled={isReadOnly}
                            onChange={(v) => scoring.updateScore(row.id, v, row.score, row.notes)}
                            className="w-16 h-9 text-center font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 disabled:bg-slate-50 disabled:text-slate-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                            id={`salat-error-${row.id}`}
                          />
                        </div>
                      </td>
                      {/* Score input */}
                      <td className="px-3 py-3 align-top pt-4">
                        <div className="flex justify-center">
                          <ScoreInput
                            id={`salat-score-${row.id}`}
                            value={row.score}
                            maxValue={row.maximum_score}
                            disabled={isReadOnly}
                            onChange={(v) => scoring.updateScore(row.id, row.error_count, v, row.notes)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-purple-50">
                  <td colSpan={2} className="px-3 py-3">
                    <span className="font-bold text-slate-700">TOTAL</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-bold text-slate-600">250</span>
                  </td>
                  <td />
                  <td className="px-3 py-3 text-center">
                    <span className={`text-xl font-extrabold ${scoring.totalScore > 250 ? 'text-red-600' : 'text-purple-700'}`}>
                      {scoring.totalScore}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile + Tablet: Cards */}
          <div className="lg:hidden space-y-3">
            {scoring.rows.map((row, idx) => (
              <div
                key={row.id}
                className={`rounded-2xl border p-4 space-y-3 ${
                  row.status === 'finalized'
                    ? 'border-slate-200 bg-slate-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Group header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-purple-700">{row.group_name}</p>
                    <span className="shrink-0 text-xs font-medium text-slate-500">
                      Maks: <span className="font-bold text-purple-600">{row.maximum_score}</span>
                    </span>
                  </div>
                  {/* Criteria list */}
                  <ul className="space-y-0.5 mb-2">
                    {row.criteria_names.map((name, i) => (
                      <li key={i} className="text-xs text-slate-500 flex gap-1.5">
                        <span className="text-slate-300 shrink-0">{row.criteria_numbers[i]}.</span>
                        <span>{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Error count */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-slate-600 w-28">Jml Kesalahan:</label>
                  <ErrorInput
                    value={row.error_count}
                    disabled={isReadOnly}
                    onChange={(v) => scoring.updateScore(row.id, v, row.score, row.notes)}
                    className="w-20 h-9 text-center font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 disabled:bg-slate-50 disabled:text-slate-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    id={`salat-error-mobile-${row.id}`}
                  />
                </div>

                {/* Score input */}
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Nilai:</label>
                  <ScoreInput
                    id={`salat-score-mobile-${row.id}`}
                    value={row.score}
                    maxValue={row.maximum_score}
                    disabled={isReadOnly}
                    onChange={(v) => scoring.updateScore(row.id, row.error_count, v, row.notes)}
                  />
                </div>
              </div>
            ))}

            {/* Mobile total card */}
            <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-purple-800">TOTAL NILAI SALAT</span>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${scoring.totalScore > 250 ? 'text-red-600' : 'text-purple-700'}`}>
                    {scoring.totalScore}
                  </span>
                  <span className="text-slate-500 font-medium">/ 250</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Loading */}
      {selectedParticipant && scoring.loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Sticky Total */}
      <StickyTotal
        totalScore={scoring.totalScore}
        maxScore={250}
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

      {/* Modals */}
      <FinalizeModal
        open={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        onConfirm={handleFinalize}
        totalScore={scoring.totalScore}
        maxScore={250}
        participantNumber={selectedParticipant?.participant_number ?? '—'}
        loading={scoring.actionLoading}
      />

      <ConfirmModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="Reset Nilai Salat"
        description={`Apakah Anda yakin ingin menghapus semua nilai salat peserta ${selectedParticipant?.participant_number ?? ''}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Reset"
        loading={scoring.actionLoading}
      />
    </div>
  )
}
