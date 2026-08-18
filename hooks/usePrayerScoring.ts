'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getPrayerScoreGroups,
  getPrayerScores,
  upsertPrayerScore,
  savePrayerScores,
  finalizePrayerScores,
  unlockPrayerScores,
  deletePrayerScores,
} from '@/services/prayer'
import type { PrayerScoreGroup, PrayerScore, PrayerScoreRow, ScoreStatus } from '@/types'
import toast from 'react-hot-toast'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function usePrayerScoring(judgeId: string | null, participantId: string | null) {
  const [groups, setGroups] = useState<PrayerScoreGroup[]>([])
  const [rows, setRows] = useState<PrayerScoreRow[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [overallStatus, setOverallStatus] = useState<SaveStatus>('idle')

  const pendingValues = useRef<Map<string, { error_count: number; score: number; notes: string }>>(new Map())
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    getPrayerScoreGroups().then(setGroups)
  }, [])

  useEffect(() => {
    if (!judgeId || !participantId) {
      setRows([])
      return
    }
    loadData()
  }, [judgeId, participantId]) // eslint-disable-line

  const loadData = useCallback(async () => {
    if (!judgeId || !participantId) return
    setLoading(true)
    const [groupsData, scoresData] = await Promise.all([
      getPrayerScoreGroups(),
      getPrayerScores(participantId, judgeId),
    ])
    setGroups(groupsData)

    const scoreMap = new Map<string, PrayerScore>()
    scoresData.forEach((s) => scoreMap.set(s.group_id, s))

    setRows(
      groupsData.map((g) => {
        const existing = scoreMap.get(g.id)
        return {
          ...g,
          score_id: existing?.id,
          error_count: existing?.error_count ?? 0,
          score: existing?.score ?? 0,
          notes: existing?.notes ?? '',
          status: existing?.status ?? 'draft',
          saveStatus: 'idle',
        }
      })
    )
    setLoading(false)
    setOverallStatus('idle')
  }, [judgeId, participantId])

  const totalScore = rows.reduce((sum, r) => sum + r.score, 0)
  const maxScore = groups.reduce((sum, g) => sum + g.maximum_score, 0)
  const isFinalized = rows.length > 0 && rows.every((r) => r.status === 'finalized')
  const hasAnyScore = rows.some((r) => r.score_id !== undefined)

  useEffect(() => {
    if (rows.length === 0) return
    if (rows.some((r) => r.saveStatus === 'saving')) {
      setOverallStatus('saving')
    } else if (rows.some((r) => r.saveStatus === 'error')) {
      setOverallStatus('error')
    } else if (rows.some((r) => r.saveStatus === 'saved')) {
      setOverallStatus('saved')
    }
  }, [rows])

  // ─── Update a single group score (with debounced auto-save) ──────────────────
  const updateScore = useCallback(
    (groupId: string, error_count: number, score: number, notes: string) => {
      const maxForGroup = groups.find((g) => g.id === groupId)?.maximum_score ?? 0
      const clampedScore = Math.min(Math.max(score, 0), maxForGroup)
      const clampedErrors = Math.max(error_count, 0)

      setRows((prev) =>
        prev.map((r) =>
          r.id === groupId
            ? { ...r, error_count: clampedErrors, score: clampedScore, notes, saveStatus: 'saving' }
            : r
        )
      )

      pendingValues.current.set(groupId, { error_count: clampedErrors, score: clampedScore, notes })

      const existing = debounceTimers.current.get(groupId)
      if (existing) clearTimeout(existing)

      const timer = setTimeout(async () => {
        const pending = pendingValues.current.get(groupId)
        if (!pending || !judgeId || !participantId) return

        const result = await upsertPrayerScore({
          participant_id: participantId,
          judge_id: judgeId,
          group_id: groupId,
          error_count: pending.error_count,
          score: pending.score,
          notes: pending.notes,
          status: 'draft',
        })

        setRows((prev) =>
          prev.map((r) =>
            r.id === groupId
              ? {
                  ...r,
                  saveStatus: result.error ? 'error' : 'saved',
                  score_id: result.data?.id ?? r.score_id,
                  status: result.data?.status ?? r.status,
                }
              : r
          )
        )

        if (result.error) toast.error('Gagal menyimpan otomatis')
      }, 1500)

      debounceTimers.current.set(groupId, timer)
    },
    [groups, judgeId, participantId]
  )

  const saveAll = useCallback(async () => {
    if (!judgeId || !participantId) return
    setActionLoading(true)
    const result = await savePrayerScores(participantId, judgeId)
    if (result.error) {
      toast.error('Gagal menyimpan: ' + result.error)
    } else {
      toast.success('Nilai berhasil disimpan')
      await loadData()
    }
    setActionLoading(false)
  }, [judgeId, participantId, loadData])

  const finalizeAll = useCallback(async () => {
    if (!judgeId || !participantId) return
    setActionLoading(true)
    const result = await finalizePrayerScores(participantId, judgeId)
    if (result.error) {
      toast.error('Gagal finalisasi: ' + result.error)
    } else {
      toast.success('Nilai berhasil difinalisasi dan dikunci')
      await loadData()
    }
    setActionLoading(false)
  }, [judgeId, participantId, loadData])

  const unlockAll = useCallback(async () => {
    if (!judgeId || !participantId) return
    setActionLoading(true)
    const result = await unlockPrayerScores(participantId, judgeId)
    if (result.error) {
      toast.error('Gagal membuka kembali: ' + result.error)
    } else {
      toast.success('Nilai berhasil dibuka kembali')
      await loadData()
    }
    setActionLoading(false)
  }, [judgeId, participantId, loadData])

  const resetAll = useCallback(async () => {
    if (!judgeId || !participantId) return
    setActionLoading(true)
    const result = await deletePrayerScores(participantId, judgeId)
    if (result.error) {
      toast.error('Gagal mereset: ' + result.error)
    } else {
      toast.success('Nilai berhasil direset')
      await loadData()
    }
    setActionLoading(false)
  }, [judgeId, participantId, loadData])

  return {
    rows,
    groups,
    loading,
    actionLoading,
    overallStatus,
    totalScore,
    maxScore,
    isFinalized,
    hasAnyScore,
    updateScore,
    saveAll,
    finalizeAll,
    unlockAll,
    resetAll,
    reload: loadData,
  }
}
