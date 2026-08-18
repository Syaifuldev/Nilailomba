// SERVER COMPONENT — export const dynamic diakui Next.js di sini
// Mencegah static pre-rendering semua halaman dashboard
export const dynamic = 'force-dynamic'

import DashboardShell from './DashboardShell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardShell>{children}</DashboardShell>
}
