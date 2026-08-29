'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Search, Download, Upload, RefreshCw, Trash2, Zap } from 'lucide-react'
import { useParticipants } from '@/hooks/useParticipants'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Table from '@/components/ui/Table'
import Modal, { ConfirmModal } from '@/components/ui/Modal'
import Badge, { AssessmentBadge } from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import type { Participant, Gender } from '@/types'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import Papa from 'papaparse'

export default function PesertaPage() {
  const { isAdmin, isOperator } = useAuth()
  const {
    participants,
    loading,
    fetchParticipants,
    addParticipant,
    editParticipant,
    removeParticipant,
    removeBulk,
    generateBulk,
    importBulk,
  } = useParticipants()

  // Local state
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalAdd, setModalAdd] = useState(false)
  const [modalEdit, setModalEdit] = useState<Participant | null>(null)
  const [modalDelete, setModalDelete] = useState<Participant | null>(null)
  const [modalBulkDelete, setModalBulkDelete] = useState(false)
  const [modalGenerate, setModalGenerate] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Form state
  const [formNumber, setFormNumber] = useState('')
  const [formGender, setFormGender] = useState<Gender>(null)
  const [formError, setFormError] = useState('')
  const [generateCount, setGenerateCount] = useState('20')
  const [generateStart, setGenerateStart] = useState('1')

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  // Filtered participants
  const filtered = useMemo(() => {
    if (!search) return participants
    return participants.filter((p) =>
      p.participant_number.includes(search.trim())
    )
  }, [participants, search])

  // Selection handlers
  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map((p) => p.id) : [])
  }

  // Add participant
  const handleAdd = async () => {
    const num = formNumber.trim().padStart(3, '0')
    if (!num) {
      setFormError('Nomor peserta wajib diisi')
      return
    }
    setActionLoading(true)
    const ok = await addParticipant(num, formGender ?? undefined)
    setActionLoading(false)
    if (ok) {
      setModalAdd(false)
      setFormNumber('')
      setFormGender(null)
      setFormError('')
    }
  }

  // Edit participant
  const handleEdit = async () => {
    if (!modalEdit) return
    const num = formNumber.trim().padStart(3, '0')
    if (!num) {
      setFormError('Nomor peserta wajib diisi')
      return
    }
    setActionLoading(true)
    const ok = await editParticipant(modalEdit.id, num, formGender ?? undefined)
    setActionLoading(false)
    if (ok) {
      setModalEdit(null)
      setFormNumber('')
      setFormGender(null)
      setFormError('')
    }
  }

  // Delete single
  const handleDelete = async () => {
    if (!modalDelete) return
    setActionLoading(true)
    await removeParticipant(modalDelete.id)
    setModalDelete(null)
    setActionLoading(false)
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    setActionLoading(true)
    await removeBulk(selectedIds)
    setSelectedIds([])
    setModalBulkDelete(false)
    setActionLoading(false)
  }

  // Generate
  const handleGenerate = async () => {
    const count = parseInt(generateCount)
    const start = parseInt(generateStart)
    if (isNaN(count) || count < 1 || count > 999) {
      toast.error('Jumlah peserta harus antara 1–999')
      return
    }
    if (isNaN(start) || start < 1) {
      toast.error('Nomor awal tidak valid')
      return
    }
    setActionLoading(true)
    await generateBulk(count, start)
    setModalGenerate(false)
    setActionLoading(false)
  }

  // Export CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(
      participants.map((p) => ({
        'Nomor Peserta': p.participant_number,
        'Status': p.status,
        'Dibuat': formatDateTime(p.created_at),
      }))
    )
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `peserta-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export berhasil')
  }

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const numbers: string[] = []
        for (const row of results.data) {
          const num = row['Nomor Peserta'] ?? row['nomor_peserta'] ?? row['number']
          if (num) numbers.push(num.trim())
        }
        if (numbers.length === 0) {
          toast.error('Tidak ada data valid di file CSV')
          return
        }
        await importBulk(numbers)
      },
    })
    e.target.value = ''
  }

  const canEdit = isAdmin || isOperator

  const columns = [
    {
      key: 'participant_number',
      label: 'Nomor Peserta',
      render: (row: Participant) => (
        <span className="font-mono font-semibold text-slate-900 text-base">
          {row.participant_number}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status Penilaian',
      render: (row: Participant) => (
        <AssessmentBadge status={row.assessment_status ?? 'belum_dinilai'} />
      ),
    },
    {
      key: 'gender',
      label: 'Jenis Kelamin',
      render: (row: Participant) => (
        <span className="text-sm text-slate-700">
          {row.gender === 'laki-laki'
            ? '♂ Laki-laki'
            : row.gender === 'perempuan'
            ? '♀ Perempuan'
            : <span className="text-slate-400 text-xs italic">—</span>}
        </span>
      ),
      className: 'hidden md:table-cell',
      headerClassName: 'hidden md:table-cell',
    },
    {
      key: 'created_at',
      label: 'Ditambahkan',
      render: (row: Participant) => (
        <span className="text-xs text-slate-500">{formatDateTime(row.created_at)}</span>
      ),
      className: 'hidden sm:table-cell',
      headerClassName: 'hidden sm:table-cell',
    },
    ...(canEdit
      ? [
          {
            key: 'actions',
            label: 'Aksi',
            render: (row: Participant) => (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFormNumber(row.participant_number)
                    setFormGender(row.gender)
                    setFormError('')
                    setModalEdit(row)
                  }}
                  id={`edit-participant-${row.participant_number}`}
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
                  id={`delete-participant-${row.participant_number}`}
                >
                  Hapus
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Daftar Peserta
          </h2>
          <p className="text-sm text-slate-500">
            {participants.length} peserta terdaftar
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={fetchParticipants}
              id="refresh-participants-btn"
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={handleExportCSV}
              id="export-participants-btn"
            >
              Export CSV
            </Button>
            <label
              htmlFor="import-csv-input"
              className="inline-flex items-center gap-2 h-8 px-3 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer transition-all duration-200"
              id="import-participants-btn"
            >
              <Upload className="h-3.5 w-3.5" />
              Import CSV
            </label>
            <input
              id="import-csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<Zap className="h-3.5 w-3.5" />}
              onClick={() => setModalGenerate(true)}
              id="generate-participants-btn"
            >
              Generate Otomatis
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                setFormNumber('')
                setFormGender(null)
                setFormError('')
                setModalAdd(true)
              }}
              id="add-participant-btn"
            >
              Tambah Peserta
            </Button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Cari nomor peserta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            id="search-participants-input"
          />
        </div>
        {selectedIds.length > 0 && canEdit && (
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setModalBulkDelete(true)}
            id="bulk-delete-btn"
          >
            Hapus {selectedIds.length} Dipilih
          </Button>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        loading={loading}
        emptyMessage="Belum ada peserta"
        emptyDescription="Tambahkan peserta secara manual atau generate otomatis"
        selectedIds={canEdit ? selectedIds : undefined}
        onSelectRow={canEdit ? handleSelectRow : undefined}
        onSelectAll={canEdit ? handleSelectAll : undefined}
      />

      {/* ─── Modals ─────────────────────────────────────── */}

      {/* Add Modal */}
      <Modal
        open={modalAdd}
        onClose={() => { setModalAdd(false); setFormError('') }}
        title="Tambah Peserta"
        description="Masukkan nomor peserta baru"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setModalAdd(false)}>Batal</Button>
            <Button loading={actionLoading} onClick={handleAdd} id="confirm-add-participant">
              Tambah
            </Button>
          </div>
        }
      >
        <Input
          id="participant-number-input"
          label="Nomor Peserta"
          placeholder="001"
          value={formNumber}
          onChange={(e) => { setFormNumber(e.target.value); setFormError('') }}
          error={formError}
          hint="Nomor akan diformat otomatis (contoh: 1 → 001)"
          required
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Select
          id="participant-gender-select"
          label="Jenis Kelamin"
          value={formGender ?? ''}
          onChange={(e) => setFormGender(e.target.value as Gender || null)}
          options={[
            { value: 'laki-laki', label: '♂ Laki-laki' },
            { value: 'perempuan', label: '♀ Perempuan' },
          ]}
          placeholder="Pilih jenis kelamin (opsional)"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!modalEdit}
        onClose={() => { setModalEdit(null); setFormError('') }}
        title="Edit Peserta"
        description={`Edit nomor peserta ${modalEdit?.participant_number}`}
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setModalEdit(null)}>Batal</Button>
            <Button loading={actionLoading} onClick={handleEdit} id="confirm-edit-participant">
              Simpan
            </Button>
          </div>
        }
      >
        <Input
          id="edit-participant-number-input"
          label="Nomor Peserta"
          placeholder="001"
          value={formNumber}
          onChange={(e) => { setFormNumber(e.target.value); setFormError('') }}
          error={formError}
          required
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
        />
        <Select
          id="edit-participant-gender-select"
          label="Jenis Kelamin"
          value={formGender ?? ''}
          onChange={(e) => setFormGender(e.target.value as Gender || null)}
          options={[
            { value: 'laki-laki', label: '♂ Laki-laki' },
            { value: 'perempuan', label: '♀ Perempuan' },
          ]}
          placeholder="Pilih jenis kelamin (opsional)"
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!modalDelete}
        onClose={() => setModalDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Peserta"
        description={`Apakah Anda yakin ingin menghapus peserta nomor ${modalDelete?.participant_number}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={actionLoading}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        open={modalBulkDelete}
        onClose={() => setModalBulkDelete(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Peserta Terpilih"
        description={`Apakah Anda yakin ingin menghapus ${selectedIds.length} peserta? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel={`Hapus ${selectedIds.length} Peserta`}
        loading={actionLoading}
      />

      {/* Generate Modal */}
      <Modal
        open={modalGenerate}
        onClose={() => setModalGenerate(false)}
        title="Generate Peserta Otomatis"
        description="Buat nomor peserta secara otomatis berurutan"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setModalGenerate(false)}>Batal</Button>
            <Button loading={actionLoading} onClick={handleGenerate} id="confirm-generate">
              Generate
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 p-3.5 text-sm text-blue-700">
            <p className="font-medium mb-1">Contoh:</p>
            <p>Nomor awal: <strong>1</strong>, Jumlah: <strong>20</strong></p>
            <p className="mt-1">→ Menghasilkan: <strong>001, 002, ..., 020</strong></p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="generate-start-input"
              label="Nomor Awal"
              type="number"
              min="1"
              value={generateStart}
              onChange={(e) => setGenerateStart(e.target.value)}
              hint="Mulai dari nomor berapa"
            />
            <Input
              id="generate-count-input"
              label="Jumlah Peserta"
              type="number"
              min="1"
              max="999"
              value={generateCount}
              onChange={(e) => setGenerateCount(e.target.value)}
              hint="Maksimal 999"
            />
          </div>
          <p className="text-xs text-slate-400">
            Nomor yang sudah ada akan dilewati (tidak duplikat).
          </p>
        </div>
      </Modal>
    </div>
  )
}
