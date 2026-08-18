'use client'

import { useState, useEffect } from 'react'
import { History, Search } from 'lucide-react'
import { getAuditLogs, auditActionLabel } from '@/services/audit'
import type { AuditLog } from '@/services/audit'
import { formatDateTime } from '@/lib/utils'
import { PageLoading } from '@/components/ui/Loading'
import { useAuth } from '@/hooks/useAuth'

export default function RiwayatPage() {
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const PAGE_SIZE = 50

  const load = async (p = 0) => {
    setLoading(true)
    const result = await getAuditLogs(p, PAGE_SIZE)
    setLogs(result.data)
    setCount(result.count)
    setPage(p)
    setLoading(false)
  }

  useEffect(() => { load(0) }, [])

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 text-sm">Hanya Admin yang dapat melihat riwayat aktivitas.</p>
      </div>
    )
  }

  if (loading) return <PageLoading />

  const totalPages = Math.ceil(count / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <History className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Riwayat Aktivitas</h2>
          <p className="text-xs text-slate-400">{count} aktivitas tercatat</p>
        </div>
      </div>

      {/* Log list */}
      {logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada aktivitas tercatat</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Waktu</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Peserta</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider">Entitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {log.profiles?.full_name ?? log.profiles?.username ?? log.user_id?.slice(0, 8) ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg font-medium text-xs ${
                      log.action.includes('finalize') ? 'bg-amber-50 text-amber-700' :
                      log.action.includes('delete') ? 'bg-red-50 text-red-700' :
                      log.action.includes('create') ? 'bg-emerald-50 text-emerald-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {auditActionLabel[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.participants ? (
                      <span className="font-mono font-bold text-blue-700">{log.participants.participant_number}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{log.entity_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-500">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, count)} dari {count}
          </p>
          <div className="flex gap-1">
            <button onClick={() => load(page - 1)} disabled={page === 0}
              className="px-3 h-8 rounded-xl border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50">← Prev</button>
            <button onClick={() => load(page + 1)} disabled={page >= totalPages - 1}
              className="px-3 h-8 rounded-xl border border-slate-200 text-xs disabled:opacity-40 hover:bg-slate-50">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
