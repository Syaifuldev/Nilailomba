'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Droplets, Church, Trophy } from 'lucide-react'
import { getParticipantScore, getJudgeBreakdown } from '@/services/scoring-calc'
import type { ParticipantScore } from '@/services/scoring-calc'
import { PageLoading } from '@/components/ui/Loading'
import { createClient } from '@/lib/supabase/client'

export default function DetailPesertaPage() {
  const params = useParams()
  const router = useRouter()
  const participantId = params.id as string

  const [score, setScore] = useState<ParticipantScore | null>(null)
  const [breakdown, setBreakdown] = useState<Awaited<ReturnType<typeof getJudgeBreakdown>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [scoreData, breakdownData] = await Promise.all([
        getParticipantScore(participantId),
        getJudgeBreakdown(participantId),
      ])
      setScore(scoreData)
      setBreakdown(breakdownData)
      setLoading(false)
    }
    load()
  }, [participantId])

  if (loading) return <PageLoading />

  if (!score) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Data peserta tidak ditemukan</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 text-sm hover:underline">← Kembali</button>
      </div>
    )
  }

  const pct = score.percentage

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900" id="back-btn">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Nomor Peserta</p>
        <p className="text-5xl font-black font-mono text-blue-700 tracking-widest">{score.participant_number}</p>
        <div className="mt-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            score.score_status === 'selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {score.score_status === 'selesai' ? '✓ Final' : '⏳ Sebagian Selesai'}
          </span>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-center">
          <Droplets className="h-5 w-5 text-sky-500 mx-auto mb-1" />
          <p className="text-xs text-slate-400 mb-1">Wudu</p>
          <p className="text-2xl font-extrabold text-sky-700">{score.wudu_score}</p>
          <p className="text-xs text-slate-400">/100</p>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-center">
          <Church className="h-5 w-5 text-purple-500 mx-auto mb-1" />
          <p className="text-xs text-slate-400 mb-1">Salat</p>
          <p className="text-2xl font-extrabold text-purple-700">{score.salat_score}</p>
          <p className="text-xs text-slate-400">/250</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center">
          <Trophy className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xs text-slate-400 mb-1">Total</p>
          <p className="text-2xl font-extrabold text-blue-700">{score.total_score}</p>
          <p className="text-xs text-slate-400">/350</p>
        </div>
      </div>

      {/* Percentage */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Persentase</span>
          <span className={`text-2xl font-extrabold ${pct >= 90 ? 'text-emerald-600' : pct >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>
            {pct}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : 'bg-amber-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Judge breakdown */}
      {breakdown && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Rincian per Juri</h3>
          {breakdown.wuduJudges.length > 0 && (
            <div>
              <p className="text-xs font-medium text-sky-600 mb-2">Juri Wudu</p>
              {breakdown.wuduJudges.map((j) => (
                <div key={j.judgeId} className="flex justify-between text-sm py-1 border-b border-slate-50">
                  <span className="text-slate-600">{j.judgeName}</span>
                  <span className="font-semibold text-sky-700">{j.total}/100</span>
                </div>
              ))}
              {breakdown.wuduJudges.length > 1 && (
                <div className="flex justify-between text-sm py-1 mt-1">
                  <span className="font-medium text-slate-700">Rata-rata</span>
                  <span className="font-bold text-sky-700">{breakdown.wuduAverage}/100</span>
                </div>
              )}
            </div>
          )}
          {breakdown.salatJudges.length > 0 && (
            <div>
              <p className="text-xs font-medium text-purple-600 mb-2">Juri Salat</p>
              {breakdown.salatJudges.map((j) => (
                <div key={j.judgeId} className="flex justify-between text-sm py-1 border-b border-slate-50">
                  <span className="text-slate-600">{j.judgeName}</span>
                  <span className="font-semibold text-purple-700">{j.total}/250</span>
                </div>
              ))}
              {breakdown.salatJudges.length > 1 && (
                <div className="flex justify-between text-sm py-1 mt-1">
                  <span className="font-medium text-slate-700">Rata-rata</span>
                  <span className="font-bold text-purple-700">{breakdown.salatAverage}/250</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
