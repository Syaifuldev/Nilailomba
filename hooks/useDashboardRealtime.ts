'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getScoringStats } from '@/services/scoring-calc'
import type { ScoringStats } from '@/services/scoring-calc'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

const DEFAULT_STATS: ScoringStats = {
  total: 0,
  belum: 0,
  sebagian: 0,
  selesai: 0,
  wudu_done: 0,
  salat_done: 0,
  highest: 0,
  lowest: 0,
  average: 0,
  top10: [],
}

export function useDashboardRealtime() {
  const [stats, setStats] = useState<ScoringStats>(DEFAULT_STATS)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const channelRef = useRef<ReturnType<typeof createClient>['channel'] extends (...args: infer A) => infer R ? R : never | null>(null)
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    const data = await getScoringStats()
    setStats(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wudu_scores' },
        () => { fetchStats() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prayer_scores' },
        () => { fetchStats() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => { fetchStats() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'competition_results' },
        () => { fetchStats() }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionStatus('connected')
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnectionStatus('disconnected')
        else setConnectionStatus('connecting')
      })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channelRef.current = channel as any

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchStats]) // eslint-disable-line

  return { stats, loading, connectionStatus, refresh: fetchStats }
}
