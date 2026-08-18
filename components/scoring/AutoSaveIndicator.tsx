'use client'

import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  status: SaveStatus
}

export default function AutoSaveIndicator({ status }: Props) {
  if (status === 'idle') return null

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ${
        status === 'saving'
          ? 'text-amber-600'
          : status === 'saved'
          ? 'text-emerald-600'
          : 'text-red-500'
      }`}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Menyimpan...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Tersimpan</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Gagal menyimpan</span>
        </>
      )}
    </div>
  )
}
