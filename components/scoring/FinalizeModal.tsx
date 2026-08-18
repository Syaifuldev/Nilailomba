'use client'

import { Lock, AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  totalScore: number
  maxScore: number
  participantNumber: string
  loading?: boolean
}

export default function FinalizeModal({
  open,
  onClose,
  onConfirm,
  totalScore,
  maxScore,
  participantNumber,
  loading,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Konfirmasi Finalisasi"
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            loading={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white"
            icon={<Lock className="h-4 w-4" />}
            id="confirm-finalize-btn"
          >
            Ya, Finalisasi
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Nilai akan dikunci setelah finalisasi
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Setelah difinalisasi, Anda tidak dapat mengubah nilai kembali.
              Hanya Admin yang dapat membuka kembali nilai yang sudah difinalisasi.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Nomor Peserta</span>
            <span className="font-mono font-bold text-slate-900">{participantNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Nilai</span>
            <span className="font-bold text-blue-700">
              {totalScore} / {maxScore}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Persentase</span>
            <span className="font-bold text-slate-700">
              {maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0}%
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Pastikan semua nilai sudah benar sebelum melanjutkan.
        </p>
      </div>
    </Modal>
  )
}
