import { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cetak Ranking — Sistem Penilaian Lomba MAPSI' }

export default function PrintRankingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 15mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
