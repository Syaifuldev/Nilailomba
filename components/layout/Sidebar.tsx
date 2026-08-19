'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Droplets,
  Church,
  Trophy,
  FileText,
  History,
  Settings,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react'
import Logo from '@/components/ui/Logo'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: ('admin' | 'juri' | 'operator')[]
  badge?: string
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'juri', 'operator'],
  },
  {
    href: '/peserta',
    label: 'Peserta',
    icon: Users,
    roles: ['admin', 'operator'],
  },
  {
    href: '/juri',
    label: 'Juri',
    icon: UserCheck,
    roles: ['admin'],
  },
  {
    href: '/penilaian-wudu',
    label: 'Penilaian Wudu',
    icon: Droplets,
    roles: ['admin', 'juri'],
  },
  {
    href: '/penilaian-salat',
    label: 'Penilaian Salat',
    icon: Church,
    roles: ['admin', 'juri'],
  },
  {
    href: '/ranking',
    label: 'Ranking',
    icon: Trophy,
    roles: ['admin', 'operator'],
  },
  {
    href: '/rekap',
    label: 'Rekap Nilai',
    icon: FileText,
    roles: ['admin', 'operator'],
  },

  {
    href: '/pengaturan',
    label: 'Pengaturan',
    icon: Settings,
    roles: ['admin'],
  },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const role = user?.profile?.role

  const filteredItems = navItems.filter(
    (item) => !role || item.roles.includes(role as 'admin' | 'juri' | 'operator')
  )

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
        <Logo size="md" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">SIMPATI MAPSI</p>
          <p className="text-[10px] font-medium text-slate-400 truncate">Sistem Penilaian Terintegrasi</p>
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-sm shadow-[var(--color-primary)]/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info & logout */}
      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 px-2 py-1.5">
          <p className="text-xs font-medium text-slate-900 truncate">
            {user?.profile?.full_name ?? user?.email ?? 'Pengguna'}
          </p>
          <p className="text-[11px] text-slate-400 capitalize">{role ?? '-'}</p>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          id="sidebar-logout-btn"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-60 xl:w-64 lg:flex-col border-r border-slate-200 bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
