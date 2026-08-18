'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Search, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import { useJudges } from '@/hooks/useJudges'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import Modal, { ConfirmModal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import type { Judge, JudgingCategory, Profile } from '@/types'
import { judgingCategoryLabel, formatDateTime } from '@/lib/utils'
import { getJuriProfiles } from '@/services/judges'

const categoryOptions = [
  { value: 'wudu', label: 'Wudu' },
  { value: 'salat', label: 'Salat' },
  { value: 'wudu_dan_salat', label: 'Wudu & Salat' },
]

interface JudgeForm {
  judge_name: string
  judging_category: JudgingCategory
  status: boolean
  user_id: string | null
}

const defaultForm: JudgeForm = {
  judge_name: '',
  judging_category: 'wudu',
  status: true,
  user_id: null,
}

export default function JuriPage() {
  const { isAdmin } = useAuth()
  const { judges, loading, fetchJudges, addJudge, editJudge, removeJudge, toggleStatus } = useJudges()

  const [search, setSearch] = useState('')
  const [modalAdd, setModalAdd] = useState(false)
  const [modalEdit, setModalEdit] = useState<Judge | null>(null)
  const [modalDelete, setModalDelete] = useState<Judge | null>(null)
  const [form, setForm] = useState<JudgeForm>(defaultForm)
  const [formErrors, setFormErrors] = useState<Partial<JudgeForm>>({})
  const [actionLoading, setActionLoading] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    fetchJudges()
    getJuriProfiles().then(res => {
      if (res.data) setProfiles(res.data)
    })
  }, [fetchJudges])

  const filtered = useMemo(() => {
    if (!search) return judges
    const q = search.toLowerCase()
    return judges.filter(
      (j) =>
        j.judge_name.toLowerCase().includes(q) ||
        judgingCategoryLabel[j.judging_category].toLowerCase().includes(q)
    )
  }, [judges, search])

  const validate = () => {
    const errors: Partial<JudgeForm> = {}
    if (!form.judge_name.trim()) {
      errors.judge_name = 'Nama juri wajib diisi' as unknown as string
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdd = async () => {
    if (!validate()) return
    setActionLoading(true)
    const ok = await addJudge({
      judge_name: form.judge_name.trim(),
      judging_category: form.judging_category,
      status: form.status,
      user_id: form.user_id,
    })
    setActionLoading(false)
    if (ok) {
      setModalAdd(false)
      setForm(defaultForm)
    }
  }

  const handleEdit = async () => {
    if (!modalEdit || !validate()) return
    setActionLoading(true)
    const ok = await editJudge(modalEdit.id, {
      judge_name: form.judge_name.trim(),
      judging_category: form.judging_category,
      status: form.status,
      user_id: form.user_id,
    })
    setActionLoading(false)
    if (ok) setModalEdit(null)
  }

  const handleDelete = async () => {
    if (!modalDelete) return
    setActionLoading(true)
    await removeJudge(modalDelete.id)
    setModalDelete(null)
    setActionLoading(false)
  }

  const handleToggle = async (judge: Judge) => {
    await toggleStatus(judge.id, !judge.status)
  }

  const categoryBadgeColor: Record<JudgingCategory, string> = {
    wudu: 'bg-sky-50 text-sky-700',
    salat: 'bg-purple-50 text-purple-700',
    wudu_dan_salat: 'bg-teal-50 text-teal-700',
  }

  const columns = [
    {
      key: 'judge_name',
      label: 'Nama Juri',
      render: (row: Judge) => (
        <span className="font-medium text-slate-900">{row.judge_name}</span>
      ),
    },
    {
      key: 'judging_category',
      label: 'Bidang Penilaian',
      render: (row: Judge) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            categoryBadgeColor[row.judging_category]
          }`}
        >
          {judgingCategoryLabel[row.judging_category]}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Judge) => <StatusBadge active={row.status} />,
    },
    {
      key: 'created_at',
      label: 'Ditambahkan',
      render: (row: Judge) => (
        <span className="text-xs text-slate-500">{formatDateTime(row.created_at)}</span>
      ),
      className: 'hidden sm:table-cell',
      headerClassName: 'hidden sm:table-cell',
    },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            label: 'Aksi',
            render: (row: Judge) => (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggle(row)
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title={row.status ? 'Nonaktifkan' : 'Aktifkan'}
                  id={`toggle-judge-${row.id}`}
                >
                  {row.status ? (
                    <ToggleRight className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setForm({
                      judge_name: row.judge_name,
                      judging_category: row.judging_category,
                      status: row.status,
                      user_id: row.user_id,
                    })
                    setFormErrors({})
                    setModalEdit(row)
                  }}
                  id={`edit-judge-${row.id}`}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    setModalDelete(row)
                  }}
                  id={`delete-judge-${row.id}`}
                >
                  Hapus
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ]

  const JudgeFormFields = () => (
    <div className="space-y-4">
      <Select
        id="judge-user-select"
        label="User Akun Login (Opsional)"
        value={form.user_id ?? ''}
        onChange={(e) =>
          setForm({ ...form, user_id: e.target.value || null })
        }
        options={[
          { value: '', label: '-- Tidak ditautkan ke akun login --' },
          ...profiles.map(p => ({
            value: p.id,
            label: p.full_name || p.username || 'Tanpa Nama'
          }))
        ]}
      />
      <Input
        id="judge-name-input"
        label="Nama Juri"
        placeholder="contoh: Ustadz Ahmad"
        value={form.judge_name}
        onChange={(e) => setForm({ ...form, judge_name: e.target.value })}
        error={String(formErrors.judge_name ?? '')}
        required
        autoFocus
      />
      <Select
        id="judge-category-select"
        label="Bidang Penilaian"
        value={form.judging_category}
        onChange={(e) =>
          setForm({ ...form, judging_category: e.target.value as JudgingCategory })
        }
        options={categoryOptions}
        required
      />
      <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Status Aktif</p>
          <p className="text-xs text-slate-400">Juri nonaktif tidak dapat digunakan</p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, status: !form.status })}
          className="focus:outline-none"
          aria-label="Toggle status"
        >
          {form.status ? (
            <ToggleRight className="h-7 w-7 text-emerald-500" />
          ) : (
            <ToggleLeft className="h-7 w-7 text-slate-300" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Daftar Juri</h2>
          <p className="text-sm text-slate-500">
            {judges.length} juri terdaftar ·{' '}
            {judges.filter((j) => j.status).length} aktif
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={fetchJudges}
              id="refresh-judges-btn"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                setForm(defaultForm)
                setFormErrors({})
                setModalAdd(true)
              }}
              id="add-judge-btn"
            >
              Tambah Juri
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <Input
        placeholder="Cari nama juri atau bidang..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
        id="search-judges-input"
      />

      {/* Table */}
      <Table
        columns={columns}
        data={filtered}
        keyExtractor={(j) => j.id}
        loading={loading}
        emptyMessage="Belum ada juri"
        emptyDescription="Tambahkan juri untuk mulai penilaian"
      />

      {/* Add Modal */}
      <Modal
        open={modalAdd}
        onClose={() => setModalAdd(false)}
        title="Tambah Juri"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setModalAdd(false)}>Batal</Button>
            <Button loading={actionLoading} onClick={handleAdd} id="confirm-add-judge">
              Tambah
            </Button>
          </div>
        }
      >
        <JudgeFormFields />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!modalEdit}
        onClose={() => setModalEdit(null)}
        title="Edit Juri"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setModalEdit(null)}>Batal</Button>
            <Button loading={actionLoading} onClick={handleEdit} id="confirm-edit-judge">
              Simpan
            </Button>
          </div>
        }
      >
        <JudgeFormFields />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!modalDelete}
        onClose={() => setModalDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Juri"
        description={`Apakah Anda yakin ingin menghapus ${modalDelete?.judge_name}? Data juri akan dihapus permanen.`}
        confirmLabel="Hapus"
        loading={actionLoading}
      />
    </div>
  )
}
