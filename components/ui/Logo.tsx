import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  iconOnly?: boolean
}

export default function Logo({ className, size = 'md', iconOnly = false }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }
  
  return (
    <div
      className={cn(
        'relative flex items-center justify-center shrink-0 bg-transparent rounded-xl p-1',
        sizeClasses[size],
        className
      )}
      aria-label="Logo SIMPATI"
    >
      {/* 
        Gambar logo akan dimuat dari folder public.
        Pastikan file gambar disimpan di: public/logo-simpati.png
      */}
      <img
        src={iconOnly ? "/logo-sm.png" : "/logo-simpati.png"}
        alt="SIMPATI MAPSI Logo"
        className="w-full h-full object-contain mix-blend-multiply"
        style={{ mixBlendMode: 'multiply' }}
      />
    </div>
  )
}
