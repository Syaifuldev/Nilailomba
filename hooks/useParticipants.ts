'use client'

import { useState, useCallback } from 'react'
import type { Participant, Gender } from '@/types'
import {
  getParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  deleteParticipants,
  generateParticipants,
  importParticipants,
} from '@/services/participants'
import toast from 'react-hot-toast'

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchParticipants = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await getParticipants()
    if (error) {
      setError(error)
      toast.error('Gagal memuat data peserta')
    } else {
      setParticipants(data ?? [])
    }
    setLoading(false)
  }, [])

  const addParticipant = async (number: string, gender: Gender) => {
    const { data, error } = await createParticipant({
      participant_number: number,
      status: 'active',
      gender,
    })
    if (error) {
      toast.error(error.includes('unique') || error.includes('duplicate') ? 'Peserta dengan nomor dan jenis kelamin ini sudah ada' : error)
      return false
    }
    if (data) setParticipants((prev) =>
      [...prev, data].sort((a, b) => {
        const numCmp = a.participant_number.localeCompare(b.participant_number)
        if (numCmp !== 0) return numCmp
        return (a.gender ?? '').localeCompare(b.gender ?? '')
      })
    )
    toast.success('Peserta berhasil ditambahkan')
    return true
  }

  const editParticipant = async (id: string, number: string, gender: Gender) => {
    const { data, error } = await updateParticipant(id, { participant_number: number, gender })
    if (error) {
      toast.error(error.includes('unique') || error.includes('duplicate') ? 'Peserta dengan nomor dan jenis kelamin ini sudah ada' : error)
      return false
    }
    if (data) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? data : p)).sort((a, b) => {
          const numCmp = a.participant_number.localeCompare(b.participant_number)
          if (numCmp !== 0) return numCmp
          return (a.gender ?? '').localeCompare(b.gender ?? '')
        })
      )
    }
    toast.success('Peserta berhasil diperbarui')
    return true
  }

  const removeParticipant = async (id: string) => {
    const { error } = await deleteParticipant(id)
    if (error) {
      toast.error('Gagal menghapus peserta')
      return false
    }
    setParticipants((prev) => prev.filter((p) => p.id !== id))
    toast.success('Peserta berhasil dihapus')
    return true
  }

  const removeBulk = async (ids: string[]) => {
    const { error } = await deleteParticipants(ids)
    if (error) {
      toast.error('Gagal menghapus peserta')
      return false
    }
    setParticipants((prev) => prev.filter((p) => !ids.includes(p.id)))
    toast.success(`${ids.length} peserta berhasil dihapus`)
    return true
  }

  const generateBulk = async (count: number, startFrom: number = 1) => {
    const { data, error } = await generateParticipants(count, startFrom)
    if (error) {
      toast.error(error.includes('unique') || error.includes('duplicate') ? 'Sebagian nomor sudah ada' : error)
      return false
    }
    if (data) {
      setParticipants((prev) =>
        [...prev, ...data].sort((a, b) => {
          const numCmp = a.participant_number.localeCompare(b.participant_number)
          if (numCmp !== 0) return numCmp
          return (a.gender ?? '').localeCompare(b.gender ?? '')
        })
      )
      toast.success(`${data.length} peserta berhasil digenerate (${data.length / 2} nomor × L+P)`)
    }
    return true
  }

  const importBulk = async (numbers: string[]) => {
    const { data, error } = await importParticipants(numbers)
    if (error) {
      toast.error('Gagal import peserta')
      return false
    }
    await fetchParticipants()
    toast.success(`Import selesai: ${data?.inserted} berhasil, ${data?.skipped} duplikat dilewati`)
    return true
  }

  return {
    participants,
    loading,
    error,
    fetchParticipants,
    addParticipant,
    editParticipant,
    removeParticipant,
    removeBulk,
    generateBulk,
    importBulk,
  }
}
