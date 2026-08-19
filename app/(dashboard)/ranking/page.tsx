'use client'

import { useState, useMemo } from 'react'
import { Trophy, Medal, ArrowUpDown, Search, RefreshCw, Lock, LockOpen } from 'lucide-react'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { finalizeCompetitionResults, reopenCompetitionResults, isResultsPublished } from '@/services/results'
import { logAudit } from '@/services/audit'
import ExportButtons from '@/components/results/ExportButtons'
import { ConfirmModal } from '@/components/ui/Modal'
import ConnectionStatus from '@/components/ui/ConnectionStatus'
import { PageLoading } from '@/components/ui/Loading'
import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RankingPage() {
  const { user, isAdmin } = useAuth()
  const { ranked, loading, refresh } = useRanking()
  const [search, setSearch] = useState('')
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const supabase = createClient()

  useEffect(() => {
    isResultsPublished().then(setIsPublished)
    const channel = supabase.channel('ranking-conn')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_results' }, () => {
        isResultsPublished().then(setIsPublished)
      })
      .subscribe((s) => {
        setConnectionStatus(s === 'SUBSCRIBED' ? 'connected' : s === 'CLOSED' ? 'disconnected' : 'connecting')
      })
    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line

  const filtered = useMemo(() => {
    if (!search.trim()) return ranked
    return ranked.filter((r) => r.participant_number.includes(search.trim()))
  }, [ranked, search])

  const handleFinalize = async () => {
    if (!user) return
    setActionLoading(true)
    const { error } = await finalizeCompetitionResults(ranked, user.id)
    if (error) {
      toast.error('Gagal finalisasi: ' + error)
    } else {
      toast.success('Hasil lomba berhasil difinalisasi!')
      await logAudit({ action: 'finalize_results', entityType: 'competition_results' })
      setIsPublished(true)
      refresh()
    }
    setActionLoading(false)
    setShowFinalizeModal(false)
  }

  const handleReopen = async () => {
    setActionLoading(true)
    const { error } = await reopenCompetitionResults()
    if (error) {
      toast.error('Gagal membuka kembali: ' + error)
    } else {
      toast.success('Hasil lomba berhasil dibuka kembali')
      await logAudit({ action: 'reopen_results', entityType: 'competition_results' })
      setIsPublished(false)
    }
    setActionLoading(false)
    setShowReopenModal(false)
  }

  const rankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-amber-500 font-black text-lg">🥇</span>
    if (rank === 2) return <span className="text-slate-400 font-black text-lg">🥈</span>
    if (rank === 3) return <span className="text-amber-700 font-black text-lg">🥉</span>
    return <span className="tabular-nums font-bold text-slate-600">{rank}</span>
  }

  if (loading) return <PageLoading />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Ranking Peserta</h2>
            <p className="text-xs text-slate-400">{ranked.length} peserta • hanya nilai finalized</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ConnectionStatus status={connectionStatus} />
          {isPublished && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              <Lock className="h-3 w-3" /> Hasil Final
            </span>
          )}
          <button
            onClick={refresh}
            className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            id="refresh-ranking-btn"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Search + Export + Admin actions */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor peserta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 h-9 w-full rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            id="ranking-search"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButtons type="ranking" data={ranked} onPrint={() => window.open('/print/ranking', '_blank')} />
          {isAdmin && (
            isPublished ? (
              <button
                onClick={() => setShowReopenModal(true)}
                className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
                id="reopen-results-btn"
              >
                <LockOpen className="h-3.5 w-3.5" /> Buka Kembali
              </button>
            ) : (
              <button
                onClick={() => setShowFinalizeModal(true)}
                disabled={ranked.length === 0}
                className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                id="finalize-results-btn"
              >
                <Lock className="h-3.5 w-3.5" /> Finalisasi Hasil
              </button>
            )
          )}
        </div>
      </div>

      {/* Ranking Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Belum ada peserta dengan nilai finalized</p>
          <p className="text-xs mt-1">Juri harus menyelesaikan dan memfinalisasi penilaian</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase w-16">Ranking</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nomor Peserta</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Nilai Wudu</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Nilai Salat</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr
                    key={r.participant_id}
                    className={`transition-colors ${r.ranking <= 3 ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3 text-center">{rankBadge(r.ranking)}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-lg text-slate-900">{r.participant_number}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-sky-700">{r.wudu_score}</span>
                      <span className="text-xs text-slate-400">/{r.wudu_judge_count > 0 ? r.wudu_judge_count * 100 : 100}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-purple-700">{r.salat_score}</span>
                      <span className="text-xs text-slate-400">/{r.salat_judge_count > 0 ? r.salat_judge_count * 250 : 250}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-900 text-base">{r.total_score}</span>
                      <span className="text-xs text-slate-400">/{(r.wudu_judge_count * 100) + (r.salat_judge_count * 250) || 350}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${r.percentage >= 90 ? 'text-emerald-600' : r.percentage >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {r.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((r) => (
              <div
                key={r.participant_id}
                className={`rounded-2xl border p-4 ${r.ranking <= 3 ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{rankBadge(r.ranking)}</div>
                    <span className="font-mono font-black text-2xl text-slate-900">{r.participant_number}</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-extrabold ${r.percentage >= 90 ? 'text-emerald-600' : r.percentage >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {r.percentage}%
                    </p>
                    <p className="text-xs text-slate-400">{r.total_score}/{(r.wudu_judge_count * 100) + (r.salat_judge_count * 250) || 350}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-slate-600">
                  <span>Wudu: <strong className="text-sky-700">{r.wudu_score}</strong>/{r.wudu_judge_count > 0 ? r.wudu_judge_count * 100 : 100}</span>
                  <span>Salat: <strong className="text-purple-700">{r.salat_score}</strong>/{r.salat_judge_count > 0 ? r.salat_judge_count * 250 : 250}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      <ConfirmModal
        open={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        onConfirm={handleFinalize}
        title="Finalisasi Hasil Lomba"
        description={`Anda akan memfinalisasi dan mengunci hasil lomba dengan ${ranked.length} peserta. Ranking tidak akan berubah otomatis setelah ini. Lanjutkan?`}
        confirmLabel="Ya, Finalisasi"
        loading={actionLoading}
      />
      <ConfirmModal
        open={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        onConfirm={handleReopen}
        title="Buka Kembali Hasil Lomba"
        description="Ranking akan dapat berubah kembali mengikuti penilaian yang ada. Lanjutkan?"
        confirmLabel="Ya, Buka Kembali"
        loading={actionLoading}
      />
    </div>
  )
}
