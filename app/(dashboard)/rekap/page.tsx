'use client'

import { useState, useMemo } from 'react'
import { ClipboardList, Search } from 'lucide-react'
import Link from 'next/link'
import { useRanking } from '@/hooks/useRanking'
import ExportButtons from '@/components/results/ExportButtons'
import { PageLoading } from '@/components/ui/Loading'

type StatusFilter = 'semua' | 'sebagian' | 'selesai'
type GenderTab = 'laki-laki' | 'perempuan'

export default function RekapPage() {
  const { allScores, loading } = useRanking()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua')
  const [genderTab, setGenderTab] = useState<GenderTab>('laki-laki')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const filtered = useMemo(() => {
    return allScores
      .filter((s) => s.score_status !== 'belum')
      .filter((s) => s.gender === genderTab)
      .filter((s) =>
        statusFilter === 'semua' ? true : s.score_status === statusFilter
      )
      .filter((s) =>
        search ? s.participant_number.includes(search.trim()) : true
      )
      .sort((a, b) => a.participant_number.localeCompare(b.participant_number))
  }, [allScores, search, statusFilter, genderTab])

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const lakiCount = allScores.filter((s) => s.score_status !== 'belum' && s.gender === 'laki-laki').length
  const perempuanCount = allScores.filter((s) => s.score_status !== 'belum' && s.gender === 'perempuan').length

  if (loading) return <PageLoading />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <ClipboardList className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Rekap Nilai</h2>
          <p className="text-xs text-slate-400">{filtered.length} peserta dengan nilai</p>
        </div>
      </div>

      {/* Gender Tabs */}
      <div className="flex rounded-2xl border border-slate-200 overflow-hidden text-sm font-medium bg-slate-50 p-1 gap-1">
        <button
          onClick={() => { setGenderTab('laki-laki'); setSearch(''); setPage(0) }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
            genderTab === 'laki-laki'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white hover:text-sky-700'
          }`}
          id="rekap-tab-laki-laki"
        >
          <span>♂ Laki-laki</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
            genderTab === 'laki-laki' ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'
          }`}>{lakiCount}</span>
        </button>
        <button
          onClick={() => { setGenderTab('perempuan'); setSearch(''); setPage(0) }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
            genderTab === 'perempuan'
              ? 'bg-pink-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white hover:text-pink-600'
          }`}
          id="rekap-tab-perempuan"
        >
          <span>♀ Perempuan</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
            genderTab === 'perempuan' ? 'bg-pink-400 text-white' : 'bg-slate-200 text-slate-600'
          }`}>{perempuanCount}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              className="pl-9 pr-3 h-9 w-44 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              id="rekap-search"
            />
          </div>
          {/* Status filter */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-medium">
            {(['semua', 'sebagian', 'selesai'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => { setStatusFilter(f); setPage(0) }}
                className={`px-3 h-9 capitalize transition-colors ${statusFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                id={`filter-${f}`}
              >
                {f === 'semua' ? 'Semua' : f === 'sebagian' ? 'Sebagian' : 'Final'}
              </button>
            ))}
          </div>
        </div>
        <ExportButtons type="rekap" data={filtered} onPrint={() => window.open('/print/rekap', '_blank')} />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada data nilai untuk {genderTab === 'laki-laki' ? 'laki-laki' : 'perempuan'}</p>
        </div>
      ) : (
        <>
          <div className={`rounded-2xl border overflow-hidden bg-white ${
            genderTab === 'laki-laki' ? 'border-sky-100' : 'border-pink-100'
          }`}>
            {/* Gender section header */}
            <div className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
              genderTab === 'laki-laki'
                ? 'bg-sky-50 text-sky-700 border-sky-100'
                : 'bg-pink-50 text-pink-700 border-pink-100'
            }`}>
              {genderTab === 'laki-laki' ? '♂ Rekap Nilai Laki-laki' : '♀ Rekap Nilai Perempuan'}
              <span className="font-normal opacity-70">— {filtered.length} peserta</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase w-10">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nomor Peserta</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Wudu</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Salat</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">%</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((s, idx) => (
                  <tr key={s.participant_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{page * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/rekap/${s.participant_id}`}
                        className={`font-mono font-bold hover:underline ${
                          genderTab === 'laki-laki' ? 'text-sky-700 hover:text-sky-900' : 'text-pink-600 hover:text-pink-800'
                        }`}
                        id={`detail-${s.participant_number}-${s.gender}`}
                      >
                        {s.participant_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-sky-700">{s.wudu_score}</span>
                      <span className="text-xs text-slate-400">/{s.wudu_judge_count > 0 ? s.wudu_judge_count * 100 : 100}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-purple-700">{s.salat_score}</span>
                      <span className="text-xs text-slate-400">/{s.salat_judge_count > 0 ? s.salat_judge_count * 250 : 250}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">{s.total_score}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${s.percentage >= 90 ? 'text-emerald-600' : s.percentage >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {s.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.score_status === 'selesai'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {s.score_status === 'selesai' ? 'Final' : 'Sebagian'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-slate-500">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} dari {filtered.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 h-8 rounded-xl border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50"
                >← Prev</button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 h-8 rounded-xl border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50"
                >Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
