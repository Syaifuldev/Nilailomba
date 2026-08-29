'use client'

import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { Participant } from '@/types'

interface Props {
  participants: Participant[]
  selectedId: string | null
  onSelect: (participant: Participant) => void
}

export default function ParticipantSelector({ participants, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const sorted = [...participants].sort((a, b) =>
    a.participant_number.localeCompare(b.participant_number)
  )

  const filtered = query
    ? sorted.filter((p) => p.participant_number.includes(query.trim()))
    : sorted

  const currentIndex = sorted.findIndex((p) => p.id === selectedId)
  const current = currentIndex >= 0 ? sorted[currentIndex] : null

  const goPrev = () => {
    if (currentIndex > 0) onSelect(sorted[currentIndex - 1])
  }
  const goNext = () => {
    if (currentIndex < sorted.length - 1) onSelect(sorted[currentIndex + 1])
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || (e.altKey && e.key === 'ArrowLeft')) goPrev()
      if (e.key === 'ArrowRight' || (e.altKey && e.key === 'ArrowRight')) goNext()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [currentIndex, sorted]) // eslint-disable-line

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      {/* Prev button */}
      <button
        onClick={goPrev}
        disabled={currentIndex <= 0}
        className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-sm font-medium"
        title="Peserta sebelumnya (←)"
        id="prev-participant-btn"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Sebelumnya</span>
      </button>

      {/* Dropdown selector */}
      <div ref={wrapperRef} className="relative flex-1 min-w-[180px]">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white text-left flex items-center justify-between gap-2 hover:border-blue-400 transition-colors"
          id="participant-dropdown-btn"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-blue-700 text-base tracking-widest">
              {current ? current.participant_number : '—'}
            </span>
            {current?.gender && (
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${current.gender === 'laki-laki' ? 'bg-sky-50 text-sky-600' : 'bg-pink-50 text-pink-600'}`}>
                {current.gender === 'laki-laki' ? '♂' : '♀'}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">
            {currentIndex >= 0
              ? `${currentIndex + 1} / ${sorted.length}`
              : `0 / ${sorted.length}`}
          </span>
        </button>

        {open && (
          <div className="absolute top-full mt-1 left-0 w-64 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nomor..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-8 pr-3 h-8 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  autoFocus
                  id="participant-search-input"
                />
              </div>
            </div>
            {/* List */}
            <div className="max-h-60 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">Tidak ditemukan</p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect(p)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center justify-between gap-2 ${
                      p.id === selectedId
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                    id={`select-participant-${p.participant_number}`}
                  >
                    <span className="font-mono font-bold">{p.participant_number}</span>
                    {p.gender && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 ${p.gender === 'laki-laki' ? 'bg-sky-50 text-sky-600' : 'bg-pink-50 text-pink-600'}`}>
                        {p.gender === 'laki-laki' ? '♂ L' : '♀ P'}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={goNext}
        disabled={currentIndex >= sorted.length - 1 || currentIndex < 0}
        className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-sm font-medium"
        title="Peserta berikutnya (→)"
        id="next-participant-btn"
      >
        <span className="hidden sm:inline">Berikutnya</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
