import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }
  
  return (
    <div
      className={cn(
        'relative flex items-center justify-center shrink-0 bg-white rounded-xl shadow-sm border border-slate-100 p-1',
        sizeClasses[size],
        className
      )}
      aria-label="Logo SIMPATI"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="simpati-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />   {/* Secondary / Green */}
            <stop offset="40%" stopColor="#38BDF8" />  {/* Accent / Light Blue */}
            <stop offset="100%" stopColor="#0D47A1" /> {/* Primary / Navy */}
          </linearGradient>
        </defs>
        
        {/* Simple dome shape placeholder */}
        <path
          d="M50 10 C35 10 25 25 25 35 C40 25 60 25 75 35 C75 25 65 10 50 10 Z"
          fill="#22C55E"
        />
        <circle cx="50" cy="5" r="3" fill="#22C55E" />
        
        {/* 'S' Shape stylized */}
        <path
          d="M75 35 C75 30 65 20 50 20 C30 20 20 35 20 50 C20 70 80 60 80 80 C80 95 65 95 50 95 C30 95 20 85 20 80"
          stroke="url(#simpati-gradient)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
