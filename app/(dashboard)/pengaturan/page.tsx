'use client'

import { useEffect, useState } from 'react'
import { Save, RefreshCw, Calendar, Building2, Award } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getCompetitionSettings, updateCompetitionSettings } from '@/services/settings'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card from '@/components/ui/Card'
import { CompetitionStatusBadge } from '@/components/ui/Badge'
import { PageLoading } from '@/components/ui/Loading'
import type { CompetitionSettings } from '@/types'
import toast from 'react-hot-toast'

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Selesai' },
]

const methodOptions = [
  { value: 'total', label: 'Total Nilai' },
  { value: 'average', label: 'Rata-rata Nilai' },
  { value: 'weighted', label: 'Nilai Berbobot' },
]

export default function PengaturanPage() {
  const { isAdmin } = useAuth()
  const [settings, setSettings] = useState<CompetitionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    competition_name: '',
    competition_year: '',
    organizer_name: '',
    competition_date: '',
    scoring_method: 'total',
    competition_status: 'draft',
  })

  const load = async () => {
    setLoading(true)
    const { data, error } = await getCompetitionSettings()
    if (error) {
      toast.error('Gagal memuat pengaturan')
    } else if (data) {
      setSettings(data)
      setForm({
        competition_name: data.competition_name ?? '',
        competition_year: data.competition_year ?? '',
        organizer_name: data.organizer_name ?? '',
        competition_date: data.competition_date ?? '',
        scoring_method: data.scoring_method ?? 'total',
        competition_status: data.competition_status ?? 'draft',
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    const { data, error } = await updateCompetitionSettings(settings.id, {
      competition_name: form.competition_name,
      competition_year: form.competition_year,
      organizer_name: form.organizer_name,
      competition_date: form.competition_date || null as unknown as string,
      scoring_method: form.scoring_method as CompetitionSettings['scoring_method'],
      competition_status: form.competition_status as CompetitionSettings['competition_status'],
    })
    if (error) {
      toast.error('Gagal menyimpan pengaturan')
    } else if (data) {
      setSettings(data)
      toast.success('Pengaturan berhasil disimpan')
    }
    setSaving(false)
  }

  if (loading) return <PageLoading />

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h3 className="text-base font-semibold text-slate-900">Akses Ditolak</h3>
        <p className="mt-1 text-sm text-slate-500">
          Hanya Admin yang dapat mengakses halaman pengaturan.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pengaturan Lomba</h2>
          <p className="text-sm text-slate-500">Atur informasi dan konfigurasi lomba</p>
        </div>
        {settings && (
          <CompetitionStatusBadge status={settings.competition_status} />
        )}
      </div>

      {/* Informasi Lomba */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">Informasi Lomba</h3>
        </div>
        <div className="space-y-4">
          <Input
            id="competition-name-input"
            label="Nama Lomba"
            placeholder="Lomba Praktik Wudu dan Salat"
            value={form.competition_name}
            onChange={(e) => setForm({ ...form, competition_name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="competition-year-input"
              label="Tahun"
              placeholder="2026"
              value={form.competition_year}
              onChange={(e) => setForm({ ...form, competition_year: e.target.value })}
            />
            <Input
              id="competition-date-input"
              label="Tanggal Pelaksanaan"
              type="date"
              value={form.competition_date}
              onChange={(e) => setForm({ ...form, competition_date: e.target.value })}
              leftIcon={<Calendar className="h-4 w-4" />}
            />
          </div>
        </div>
      </Card>

      {/* Penyelenggara */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">Penyelenggara</h3>
        </div>
        <Input
          id="organizer-name-input"
          label="Nama Penyelenggara"
          placeholder="Panitia Lomba MAPSI"
          value={form.organizer_name}
          onChange={(e) => setForm({ ...form, organizer_name: e.target.value })}
        />
      </Card>

      {/* Konfigurasi Sistem */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">Konfigurasi Sistem</h3>
        </div>
        <div className="space-y-4">
          <Select
            id="scoring-method-select"
            label="Metode Ranking"
            value={form.scoring_method}
            onChange={(e) => setForm({ ...form, scoring_method: e.target.value })}
            options={methodOptions}
            hint="Metode yang digunakan untuk menghitung peringkat peserta"
          />
          <Select
            id="competition-status-select"
            label="Status Lomba"
            value={form.competition_status}
            onChange={(e) => setForm({ ...form, competition_status: e.target.value })}
            options={statusOptions}
            hint="Draft: persiapan, Aktif: penilaian berlangsung, Selesai: lomba berakhir"
          />
        </div>
      </Card>

      {/* Save button */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={load} id="reset-settings-btn">
          Reset
        </Button>
        <Button
          loading={saving}
          onClick={handleSave}
          icon={<Save className="h-4 w-4" />}
          id="save-settings-btn"
        >
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  )
}
