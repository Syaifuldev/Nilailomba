'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getWuduCriteria,
  getWuduScores,
  upsertWuduScore,
  saveWuduScores,
  finalizeWuduScores,
  unlockWuduScores,
  deleteWuduScores,
} from '@/services/wudu'
import type { WuduCriteria, WuduScore, WuduScoreRow, ScoreStatus } from '@/types'
import toast from 'react-hot-toast'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useWuduScoring(judgeId: string | null, participantId: string | null) {
  const [criteria, setCriteria] = useState<WuduCriteria[]>([])
  const [rows, setRows] = useState<WuduScoreRow[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [overallStatus, setOverallStatus] = useState<SaveStatus>('idle')

  // Pending values (avoid stale closure in debounce)
  const pendingScores = useRef<Map<string, { score: number; notes: string }>>(new Map())
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Load criteria once
  useEffect(() => {
    getWuduCriteria().then(setCriteria)
  }, [])

  // Load scores when participant or judge changes
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
    const [criteriaData, scoresData] = await Promise.all([
      getWuduCriteria(),
      getWuduScores(participantId, judgeId),
    ])
    setCriteria(criteriaData)

    const scoreMap = new Map<string, WuduScore>()
    scoresData.forEach((s) => scoreMap.set(s.criteria_id, s))

    setRows(
      criteriaData.map((c) => {
        const existing = scoreMap.get(c.id)
        return {
          ...c,
          score_id: existing?.id,
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

  // Compute totals
  const totalScore = rows.reduce((sum, r) => sum + r.score, 0)
  const maxScore = criteria.reduce((sum, c) => sum + c.maximum_score, 0)
  const isFinalized = rows.length > 0 && rows.every((r) => r.status === 'finalized')
  const hasAnyScore = rows.some((r) => r.score_id !== undefined)

  // Update overall status whenever row save statuses change
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

  // ─── Update a single score (with debounced auto-save) ────────────────────────
  const updateScore = useCallback(
    (criteriaId: string, score: number, notes: string) => {
      // Clamp score
      const maxForCriteria = criteria.find((c) => c.id === criteriaId)?.maximum_score ?? 0
      const clampedScore = Math.min(Math.max(score, 0), maxForCriteria)

      // Update display immediately
      setRows((prev) =>
        prev.map((r) =>
          r.id === criteriaId
            ? { ...r, score: clampedScore, notes, saveStatus: 'saving' }
            : r
        )
      )

      // Store pending value
      pendingScores.current.set(criteriaId, { score: clampedScore, notes })

      // Clear existing debounce, set new
      const existing = debounceTimers.current.get(criteriaId)
      if (existing) clearTimeout(existing)

      const timer = setTimeout(async () => {
        const pending = pendingScores.current.get(criteriaId)
        if (!pending || !judgeId || !participantId) return

        const result = await upsertWuduScore({
          participant_id: participantId,
          judge_id: judgeId,
          criteria_id: criteriaId,
          score: pending.score,
          notes: pending.notes,
          status: 'draft',
        })

        setRows((prev) =>
          prev.map((r) =>
            r.id === criteriaId
              ? {
                  ...r,
                  saveStatus: result.error ? 'error' : 'saved',
                  score_id: result.data?.id ?? r.score_id,
                  status: result.data?.status ?? r.status,
                }
              : r
          )
        )

        if (result.error) {
          toast.error('Gagal menyimpan otomatis')
        }
      }, 1500)

      debounceTimers.current.set(criteriaId, timer)
    },
    [criteria, judgeId, participantId]
  )

  // ─── Save all scores ─────────────────────────────────────────────────────────
  const saveAll = useCallback(async () => {
    if (!judgeId || !participantId) return
    setActionLoading(true)
    const result = await saveWuduScores(participantId, judgeId)
    if (result.error) {
      toast.error('Gagal menyimpan: ' + result.error)
    } else {
      toast.success('Nilai berhasil disimpan')
      await loadData()
    }
    setActionLoading(false)
  }, [judgeId, participantId, loadData])

  // ─── Finalize all scores ─────────────────────────────────────────────────────
  const finalizeAll = useCallback(async () => {
    if (!judgeId || !participantId) return
    setActionLoading(true)
    const result = await finalizeWuduScores(participantId, judgeId)
    if (result.error) {
      toast.error('Gagal finalisasi: ' + result.error)
    } else {
      toast.success('Nilai berhasil difinalisasi dan dikunci')
      await loadData()
    }
    setActionLoading(false)
  }, [judgeId, participantId, loadData])

  // ─── Unlock (admin) ──────────────────────────────────────────────────────────
  const unlockAll = useCallback(async () => {
    if (!judgeId || !participantId) return
    setActionLoading(true)
    const result = await unlockWuduScores(participantId, judgeId)
    if (result.error) {
      toast.error('Gagal membuka kembali: ' + result.error)
    } else {
      toast.success('Nilai berhasil dibuka kembali')
      await loadData()
    }
    setActionLoading(false)
  }, [judgeId, participantId, loadData])

  // ─── Reset all scores ────────────────────────────────────────────────────────
  const resetAll = useCallback(async () => {
    if (!judgeId || !participantId) return
    setActionLoading(true)
    const result = await deleteWuduScores(participantId, judgeId)
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
    criteria,
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
