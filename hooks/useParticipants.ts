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

  const addParticipant = async (number: string, gender?: Gender) => {
    const { data, error } = await createParticipant({
      participant_number: number,
      status: 'active',
      gender: gender ?? null,
    })
    if (error) {
      toast.error(error.includes('unique') ? 'Nomor peserta sudah ada' : error)
      return false
    }
    if (data) setParticipants((prev) => [...prev, data].sort((a, b) => a.participant_number.localeCompare(b.participant_number)))
    toast.success('Peserta berhasil ditambahkan')
    return true
  }

  const editParticipant = async (id: string, number: string, gender?: Gender) => {
    const { data, error } = await updateParticipant(id, { participant_number: number, gender: gender ?? null })
    if (error) {
      toast.error(error.includes('unique') ? 'Nomor peserta sudah ada' : error)
      return false
    }
    if (data) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? data : p)).sort((a, b) => a.participant_number.localeCompare(b.participant_number))
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
      toast.error(error.includes('unique') ? 'Sebagian nomor sudah ada' : error)
      return false
    }
    if (data) {
      setParticipants((prev) =>
        [...prev, ...data].sort((a, b) => a.participant_number.localeCompare(b.participant_number))
      )
      toast.success(`${data.length} peserta berhasil digenerate`)
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
