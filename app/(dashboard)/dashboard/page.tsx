'use client'

import { useEffect, useState } from 'react'
import {
  Users, UserCheck, Clock, CheckCircle, Star, TrendingUp,
  Droplets, Church, Trophy, Activity, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/ui/Card'
import Card from '@/components/ui/Card'
import { CardSkeleton } from '@/components/ui/Loading'
import { getDashboardStats, getCompetitionSettings } from '@/services/settings'
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime'
import { useAuth } from '@/hooks/useAuth'
import ConnectionStatus from '@/components/ui/ConnectionStatus'
import type { DashboardStats, CompetitionSettings } from '@/types'
import { formatDate } from '@/lib/utils'
import { CompetitionStatusBadge } from '@/components/ui/Badge'

export default function DashboardPage() {
  const { user } = useAuth()
  const [baseStats, setBaseStats] = useState<DashboardStats | null>(null)
  const [settings, setSettings] = useState<CompetitionSettings | null>(null)
  const [baseLoading, setBaseLoading] = useState(true)

  const { stats: scoringStats, loading: scoringLoading, connectionStatus, refresh } = useDashboardRealtime()

  useEffect(() => {
    async function load() {
      const [statsData, settingsData] = await Promise.all([
        getDashboardStats(),
        getCompetitionSettings(),
      ])
      setBaseStats(statsData)
      setSettings(settingsData.data)
      setBaseLoading(false)
    }
    load()
  }, [])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Selamat pagi'
    if (hour < 15) return 'Selamat siang'
    if (hour < 18) return 'Selamat sore'
    return 'Selamat malam'
  }

  const total = baseStats?.total_participants ?? 0
  const wuduPct = total > 0 ? Math.round((scoringStats.wudu_done / total) * 100) : 0
  const salatPct = total > 0 ? Math.round((scoringStats.salat_done / total) * 100) : 0
  const selesaiPct = total > 0 ? Math.round((scoringStats.selesai / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Welcome + Connection */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {greeting()},{' '}
            <span className="text-blue-600">
              {user?.profile?.full_name ?? user?.email?.split('@')[0] ?? 'Pengguna'}
            </span>{' '}
            👋
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConnectionStatus status={connectionStatus} />
          <button
            onClick={refresh}
            className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            title="Refresh"
            id="dashboard-refresh-btn"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Competition info */}
      {settings && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Lomba Aktif</p>
              <h3 className="mt-0.5 text-base font-semibold text-slate-900">
                {settings.competition_name ?? 'Belum ada nama lomba'}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {settings.competition_year && <span>Tahun {settings.competition_year}</span>}
                {settings.organizer_name && <><span>·</span><span>{settings.organizer_name}</span></>}
                {settings.competition_date && <><span>·</span><span>{formatDate(settings.competition_date)}</span></>}
              </div>
            </div>
            <CompetitionStatusBadge status={settings.competition_status} />
          </div>
        </Card>
      )}

      {/* Base stats grid */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Peserta</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {baseLoading ? (
            Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <StatCard title="Total Peserta" value={total} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-50" description="Peserta terdaftar" />
              <StatCard title="Total Juri" value={baseStats?.total_judges ?? 0} icon={UserCheck} iconColor="text-purple-600" iconBg="bg-purple-50" description={`${baseStats?.active_judges ?? 0} aktif`} />
              <StatCard title="Belum Dinilai" value={scoringStats.belum + scoringStats.sebagian} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" description="Belum/sebagian selesai" />
              <StatCard title="Wudu Selesai" value={scoringStats.wudu_done} icon={Droplets} iconColor="text-sky-600" iconBg="bg-sky-50" description={`dari ${total} peserta`} />
              <StatCard title="Salat Selesai" value={scoringStats.salat_done} icon={Church} iconColor="text-purple-600" iconBg="bg-purple-50" description={`dari ${total} peserta`} />
              <StatCard title="Final" value={scoringStats.selesai} icon={Star} iconColor="text-orange-600" iconBg="bg-orange-50" description="Semua nilai finalized" />
            </>
          )}
        </div>
      </div>

      {/* Progress bars */}
      {!baseLoading && total > 0 && (
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Progress Penilaian</h3>
          <div className="space-y-4">
            {/* Wudu */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-600"><Droplets className="h-3.5 w-3.5 text-sky-500" /> Wudu</span>
                <span className="text-sky-700">{scoringStats.wudu_done} / {total} ({wuduPct}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-sky-500 transition-all duration-700" style={{ width: `${wuduPct}%` }} />
              </div>
            </div>
            {/* Salat */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-600"><Church className="h-3.5 w-3.5 text-purple-500" /> Salat</span>
                <span className="text-purple-700">{scoringStats.salat_done} / {total} ({salatPct}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-purple-500 transition-all duration-700" style={{ width: `${salatPct}%` }} />
              </div>
            </div>
            {/* Overall */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="flex items-center gap-1.5 text-slate-600"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Selesai (semua final)</span>
                <span className="text-emerald-700">{scoringStats.selesai} / {total} ({selesaiPct}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${selesaiPct === 100 ? 'bg-emerald-500' : 'bg-emerald-400'}`} style={{ width: `${selesaiPct}%` }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Score stats + Top 10 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score stats */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Statistik Nilai</h3>
          {scoringLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : scoringStats.selesai === 0 ? (
            <p className="text-xs text-slate-400">Belum ada nilai yang difinalisasi</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                <span className="text-xs font-medium text-slate-600">Nilai Tertinggi</span>
                <span className="font-bold text-emerald-700">{scoringStats.highest} / 350</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                <span className="text-xs font-medium text-slate-600">Nilai Terendah</span>
                <span className="font-bold text-red-600">{scoringStats.lowest} / 350</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                <span className="text-xs font-medium text-slate-600">Rata-rata</span>
                <span className="font-bold text-blue-700">{scoringStats.average} / 350</span>
              </div>
            </div>
          )}
        </Card>

        {/* Top 10 */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" /> Ranking Sementara Top 10
            </h3>
            <Link href="/ranking" className="text-xs text-blue-600 hover:underline" id="see-all-ranking">
              Lihat semua →
            </Link>
          </div>
          {scoringLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : scoringStats.top10.length === 0 ? (
            <p className="text-xs text-slate-400">Belum ada ranking. Juri belum memfinalisasi penilaian.</p>
          ) : (
            <div className="space-y-1.5">
              {scoringStats.top10.map((r) => (
                <div key={r.participant_id} className={`flex items-center justify-between rounded-xl px-3 py-2 ${r.ranking <= 3 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {r.ranking === 1 ? '🥇' : r.ranking === 2 ? '🥈' : r.ranking === 3 ? '🥉' : `${r.ranking}.`}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{r.participant_number}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">{r.total_score}</span>
                    <span className="text-xs text-slate-400 ml-1">({r.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Status sistem */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Status Sistem</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 ${connectionStatus === 'connected' ? 'bg-emerald-50' : connectionStatus === 'connecting' ? 'bg-amber-50' : 'bg-red-50'}`}>
            <div className={`h-2 w-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : connectionStatus === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${connectionStatus === 'connected' ? 'text-emerald-700' : connectionStatus === 'connecting' ? 'text-amber-700' : 'text-red-700'}`}>
              {connectionStatus === 'connected' ? 'Realtime terhubung' : connectionStatus === 'connecting' ? 'Menghubungkan...' : 'Realtime offline'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-emerald-700 font-medium">Database terhubung</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
