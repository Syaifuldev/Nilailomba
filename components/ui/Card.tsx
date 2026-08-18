'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export default function Card({ children, className, padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-sm',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  description?: string
  trend?: {
    value: string
    positive: boolean
  }
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  description,
  trend,
}: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-1.5 text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
            {value}
          </p>
          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                'mt-1.5 text-xs font-medium',
                trend.positive ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            iconBg
          )}
        >
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
    </Card>
  )
}
