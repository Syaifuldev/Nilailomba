'use client'

import { useState, useCallback } from 'react'
import type { Judge, JudgeFormData } from '@/types'
import {
  getJudges,
  createJudge,
  updateJudge,
  deleteJudge,
  toggleJudgeStatus,
} from '@/services/judges'
import toast from 'react-hot-toast'

export function useJudges() {
  const [judges, setJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJudges = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await getJudges()
    if (error) {
      setError(error)
      toast.error('Gagal memuat data juri')
    } else {
      setJudges(data ?? [])
    }
    setLoading(false)
  }, [])

  const addJudge = async (formData: Omit<JudgeFormData, 'email' | 'password' | 'username'>) => {
    const { data, error } = await createJudge(formData)
    if (error) {
      toast.error('Gagal menambahkan juri')
      return false
    }
    if (data) setJudges((prev) => [...prev, data])
    toast.success('Juri berhasil ditambahkan')
    return true
  }

  const editJudge = async (
    id: string,
    formData: Partial<Omit<JudgeFormData, 'email' | 'password' | 'username'>>
  ) => {
    const { data, error } = await updateJudge(id, formData)
    if (error) {
      toast.error('Gagal memperbarui juri')
      return false
    }
    if (data) setJudges((prev) => prev.map((j) => (j.id === id ? data : j)))
    toast.success('Juri berhasil diperbarui')
    return true
  }

  const removeJudge = async (id: string) => {
    const { error } = await deleteJudge(id)
    if (error) {
      toast.error('Gagal menghapus juri')
      return false
    }
    setJudges((prev) => prev.filter((j) => j.id !== id))
    toast.success('Juri berhasil dihapus')
    return true
  }

  const toggleStatus = async (id: string, status: boolean) => {
    const { data, error } = await toggleJudgeStatus(id, status)
    if (error) {
      toast.error('Gagal mengubah status juri')
      return false
    }
    if (data) setJudges((prev) => prev.map((j) => (j.id === id ? data : j)))
    toast.success(status ? 'Juri diaktifkan' : 'Juri dinonaktifkan')
    return true
  }

  return {
    judges,
    loading,
    error,
    fetchJudges,
    addJudge,
    editJudge,
    removeJudge,
    toggleStatus,
  }
}
