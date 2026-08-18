'use client'

import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  emptyMessage?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  selectedIds?: string[]
  onSelectRow?: (id: string, checked: boolean) => void
  onSelectAll?: (checked: boolean) => void
  className?: string
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'Tidak ada data',
  emptyDescription,
  onRowClick,
  selectedIds,
  onSelectRow,
  onSelectAll,
  className,
}: TableProps<T>) {
  const hasSelection = !!onSelectRow
  const allSelected = selectedIds?.length === data.length && data.length > 0
  const someSelected = (selectedIds?.length ?? 0) > 0 && !allSelected

  if (loading) {
    return (
      <div className={cn('overflow-hidden rounded-xl border border-slate-200', className)}>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-4 w-4 rounded bg-slate-200 animate-pulse" />
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="h-4 flex-1 rounded bg-slate-200 animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center',
          className
        )}
      >
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm font-medium text-slate-700">{emptyMessage}</p>
        {emptyDescription && (
          <p className="mt-1 text-xs text-slate-400">{emptyDescription}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {hasSelection && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Pilih semua"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500',
                    col.headerClassName
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row) => {
              const id = keyExtractor(row)
              const isSelected = selectedIds?.includes(id)
              return (
                <tr
                  key={id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-slate-50',
                    isSelected && 'bg-blue-50'
                  )}
                >
                  {hasSelection && (
                    <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected ?? false}
                        onChange={(e) => onSelectRow?.(id, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Pilih baris ${id}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3.5 text-sm text-slate-700', col.className)}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
