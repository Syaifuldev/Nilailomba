'use client'

import { Wifi, WifiOff, Loader2 } from 'lucide-react'

type Status = 'connecting' | 'connected' | 'disconnected'

export default function ConnectionStatus({ status }: { status: Status }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
        status === 'connected'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : status === 'connecting'
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      {status === 'connected' && <Wifi className="h-3 w-3" />}
      {status === 'connecting' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'disconnected' && <WifiOff className="h-3 w-3" />}
      <span>
        {status === 'connected'
          ? 'Terhubung'
          : status === 'connecting'
          ? 'Menghubungkan...'
          : 'Offline'}
      </span>
    </div>
  )
}
