'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import Button from './Button'

interface EmptyStateProps {
  icon?: LucideIcon
  emoji?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  className?: string
}

export default function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 px-6 text-center',
        className
      )}
    >
      {emoji && <div className="text-5xl mb-4">{emoji}</div>}
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
          <Icon className="h-7 w-7 text-slate-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500 max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          <Button onClick={action.onClick} icon={action.icon} size="md">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
