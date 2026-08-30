'use client'

import { Lock, AlertTriangle, XCircle } from 'lucide-react'
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
  /** Jumlah kriteria/grup yang belum diisi nilainya */
  emptyCount?: number
}

export default function FinalizeModal({
  open,
  onClose,
  onConfirm,
  totalScore,
  maxScore,
  participantNumber,
  loading,
  emptyCount = 0,
}: Props) {
  const hasEmpty = emptyCount > 0

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
            disabled={hasEmpty}
            className={`${
              hasEmpty
                ? 'bg-slate-300 hover:bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
            icon={<Lock className="h-4 w-4" />}
            id="confirm-finalize-btn"
          >
            Ya, Finalisasi
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Warning nilai kosong — tampil hanya jika ada yang kosong */}
        {hasEmpty && (
          <div className="flex gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Ada {emptyCount} kriteria yang belum dinilai!
              </p>
              <p className="mt-1 text-xs text-red-700">
                Anda tidak dapat melakukan finalisasi. Harap kembali dan pastikan semua kriteria sudah terisi dengan nilai (minimal 0 jika memang 0) sebelum mengunci nilai.
              </p>
            </div>
          </div>
        )}

        {/* Standard warning (Sembunyikan jika ada error kosong agar tidak membingungkan) */}
        {!hasEmpty && (
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
        )}

        {/* Summary */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Nomor Peserta</span>
            <span className="font-mono font-bold text-slate-900">{participantNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Nilai</span>
            <span className={`font-bold ${hasEmpty ? 'text-red-600' : 'text-blue-700'}`}>
              {totalScore} / {maxScore}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Persentase</span>
            <span className="font-bold text-slate-700">
              {maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0}%
            </span>
          </div>
          {hasEmpty && (
            <div className="flex justify-between text-sm pt-1 border-t border-red-100">
              <span className="text-red-500">Kriteria belum dinilai</span>
              <span className="font-bold text-red-600">{emptyCount} kriteria</span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center">
          Pastikan semua nilai sudah benar sebelum melanjutkan.
        </p>
      </div>
    </Modal>
  )
}
