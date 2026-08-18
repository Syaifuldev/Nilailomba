'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRankedParticipants, getParticipantScores } from '@/services/scoring-calc'
import type { RankedParticipant, ParticipantScore } from '@/services/scoring-calc'

export function useRanking() {
  const [ranked, setRanked] = useState<RankedParticipant[]>([])
  const [allScores, setAllScores] = useState<ParticipantScore[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    const [rankedData, allData] = await Promise.all([
      getRankedParticipants(),
      getParticipantScores(),
    ])
    setRanked(rankedData)
    setAllScores(allData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRanking()

    const channel = supabase
      .channel('ranking-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wudu_scores' }, fetchRanking)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prayer_scores' }, fetchRanking)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchRanking]) // eslint-disable-line

  return { ranked, allScores, loading, refresh: fetchRanking }
}
