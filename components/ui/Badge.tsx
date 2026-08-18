'use client'

import { cn } from '@/lib/utils'
import type { AssessmentStatus, UserRole, CompetitionStatus } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple'
    | 'blue'
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-sky-50 text-sky-700',
    purple: 'bg-purple-50 text-purple-700',
    blue: 'bg-blue-50 text-blue-700',
  }

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])}
        />
      )}
      {children}
    </span>
  )
}

// ─── Typed badge helpers ───────────────────────────────────────────────────────
export function AssessmentBadge({ status }: { status: AssessmentStatus }) {
  const config: Record<AssessmentStatus, { label: string; variant: BadgeProps['variant'] }> = {
    belum_dinilai: { label: 'Belum Dinilai', variant: 'default' },
    sedang_dinilai: { label: 'Sedang Dinilai', variant: 'warning' },
    sebagian_selesai: { label: 'Sebagian Selesai', variant: 'info' },
    selesai: { label: 'Selesai', variant: 'success' },
    final: { label: 'Final', variant: 'purple' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant} dot>{label}</Badge>
}

export function RoleBadge({ role }: { role: UserRole }) {
  const config: Record<UserRole, { label: string; variant: BadgeProps['variant'] }> = {
    admin: { label: 'Admin', variant: 'purple' },
    juri: { label: 'Juri', variant: 'blue' },
    operator: { label: 'Operator', variant: 'info' },
  }
  const { label, variant } = config[role]
  return <Badge variant={variant}>{label}</Badge>
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'success' : 'danger'} dot>
      {active ? 'Aktif' : 'Nonaktif'}
    </Badge>
  )
}

export function CompetitionStatusBadge({ status }: { status: CompetitionStatus }) {
  const config: Record<CompetitionStatus, { label: string; variant: BadgeProps['variant'] }> = {
    draft: { label: 'Draft', variant: 'default' },
    active: { label: 'Aktif', variant: 'success' },
    completed: { label: 'Selesai', variant: 'purple' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant} dot>{label}</Badge>
}
