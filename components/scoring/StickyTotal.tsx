'use client'

import { Lock, Save, FileText, RotateCcw, LockOpen } from 'lucide-react'
import Button from '@/components/ui/Button'
import AutoSaveIndicator from './AutoSaveIndicator'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  totalScore: number
  maxScore: number
  isFinalized: boolean
  isAdmin: boolean
  overallStatus: SaveStatus
  actionLoading: boolean
  hasParticipant: boolean
  onDraft: () => void
  onSave: () => void
  onFinalize: () => void
  onUnlock: () => void
  onReset: () => void
}

export default function StickyTotal({
  totalScore,
  maxScore,
  isFinalized,
  isAdmin,
  overallStatus,
  actionLoading,
  hasParticipant,
  onDraft,
  onSave,
  onFinalize,
  onUnlock,
  onReset,
}: Props) {
  const pct = maxScore > 0 ? Math.min((totalScore / maxScore) * 100, 100) : 0
  const scoreColor =
    pct >= 80
      ? 'text-emerald-600'
      : pct >= 60
      ? 'text-blue-600'
      : pct >= 40
      ? 'text-amber-600'
      : 'text-red-500'

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-60 xl:left-64 z-40">
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)] px-4 py-3 sm:px-6">
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct >= 80
                ? 'bg-emerald-500'
                : pct >= 60
                ? 'bg-blue-500'
                : pct >= 40
                ? 'bg-amber-400'
                : 'bg-red-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Total score */}
          <div className="flex items-baseline gap-2">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium leading-none mb-0.5">
                Total Nilai
              </p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${scoreColor}`}>
                  {totalScore}
                </span>
                <span className="text-sm text-slate-400 font-medium">/ {maxScore}</span>
              </div>
            </div>
            <div className="ml-2 hidden sm:block">
              <AutoSaveIndicator status={overallStatus} />
            </div>
          </div>

          {/* Action buttons */}
          {hasParticipant && (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {isFinalized ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Nilai Terkunci</span>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<LockOpen className="h-3.5 w-3.5" />}
                      onClick={onUnlock}
                      loading={actionLoading}
                      id="unlock-scores-btn"
                    >
                      Buka Kembali
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                    onClick={onReset}
                    loading={actionLoading}
                    className="text-slate-500 hidden sm:flex"
                    id="reset-scores-btn"
                  >
                    Reset
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Lock className="h-3.5 w-3.5" />}
                    onClick={onFinalize}
                    loading={actionLoading}
                    id="finalize-scores-btn"
                  >
                    Finalisasi
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile auto-save indicator */}
        <div className="mt-1.5 sm:hidden">
          <AutoSaveIndicator status={overallStatus} />
        </div>
      </div>
    </div>
  )
}
