'use client'

import { useState, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'

interface Props {
  id: string
  value: number
  maxValue: number
  disabled?: boolean
  onChange: (value: number) => void
}

export default function ScoreInput({ id, value, maxValue, disabled, onChange }: Props) {
  const [inputVal, setInputVal] = useState(String(value))
  const isOverMax = value > maxValue
  const isNegative = value < 0

  // Sync when parent value changes (e.g. on load)
  useEffect(() => {
    setInputVal(String(value))
  }, [value])

  const clamp = (v: number) => Math.min(Math.max(v, 0), maxValue)

  const commit = (raw: string) => {
    const n = parseFloat(raw)
    if (isNaN(n)) {
      setInputVal(String(value))
      return
    }
    const clamped = clamp(n)
    setInputVal(String(clamped))
    if (clamped !== value) onChange(clamped)
  }

  const decrement = () => {
    const next = clamp(value - 1)
    setInputVal(String(next))
    onChange(next)
  }

  const increment = () => {
    const next = clamp(value + 1)
    setInputVal(String(next))
    onChange(next)
  }

  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0

  return (
    <div className="flex flex-col gap-1 items-end">
      <div className="flex items-center gap-1.5">
        {/* Minus */}
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || value <= 0}
          className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          id={`${id}-dec`}
          aria-label="Kurangi"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        {/* Input */}
        <div className="relative">
          <input
            type="number"
            id={id}
            min={0}
            max={maxValue}
            step={1}
            value={inputVal}
            disabled={disabled}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(inputVal)
              if (e.key === 'ArrowUp') { e.preventDefault(); increment() }
              if (e.key === 'ArrowDown') { e.preventDefault(); decrement() }
            }}
            className={`w-16 h-10 text-center font-bold text-lg rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
              ${disabled
                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                : isOverMax || isNegative
                ? 'border-red-400 bg-red-50 text-red-600 focus:ring-red-500/20 focus:border-red-400'
                : 'border-slate-300 bg-white text-slate-900 focus:border-blue-400'
              }`}
          />
        </div>

        {/* Plus */}
        <button
          type="button"
          onClick={increment}
          disabled={disabled || value >= maxValue}
          className="w-8 h-8 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          id={`${id}-inc`}
          aria-label="Tambah"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Mini progress */}
      <div className="flex items-center gap-1.5 w-full justify-end">
        <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-amber-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 tabular-nums">{value}/{maxValue}</span>
      </div>

      {/* Validation message */}
      {isOverMax && (
        <p className="text-xs text-red-500">Maks {maxValue}</p>
      )}
    </div>
  )
}
