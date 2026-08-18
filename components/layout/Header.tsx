'use client'

import { Menu, Bell } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/peserta': 'Manajemen Peserta',
  '/juri': 'Manajemen Juri',
  '/penilaian-wudu': 'Penilaian Wudu',
  '/penilaian-salat': 'Penilaian Salat',
  '/ranking': 'Ranking',
  '/rekap': 'Rekap Nilai',
  '/riwayat': 'Riwayat Aktivitas',
  '/pengaturan': 'Pengaturan',
}

interface HeaderProps {
  onMobileMenuOpen: () => void
}

export default function Header({ onMobileMenuOpen }: HeaderProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  // Find the matching title (handle nested routes)
  const title =
    Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] ??
    'Sistem Penilaian Lomba'

  return (
    <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-3 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 sm:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        aria-label="Buka menu"
        id="mobile-menu-btn"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
          {title}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification placeholder */}
        <button
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors relative"
          aria-label="Notifikasi"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold shrink-0">
          {(user?.profile?.full_name ?? user?.email ?? 'U')
            .charAt(0)
            .toUpperCase()}
        </div>
      </div>
    </header>
  )
}
