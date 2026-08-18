'use client'

import * as XLSX from 'xlsx'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { RankedParticipant, ParticipantScore } from '@/services/scoring-calc'

// ─── Export helpers ───────────────────────────────────────────────────────────

function toExcelRows(data: RankedParticipant[]) {
  return data.map((r) => ({
    Ranking: r.ranking,
    'Nomor Peserta': `\t${r.participant_number}`, // prefix tab to force text in Excel
    'Nilai Wudu': r.wudu_score,
    'Nilai Salat': r.salat_score,
    'Total Nilai': r.total_score,
    'Persentase (%)': r.percentage,
  }))
}

function toRekapRows(data: ParticipantScore[]) {
  return data
    .filter((s) => s.score_status !== 'belum')
    .map((s, i) => ({
      No: i + 1,
      'Nomor Peserta': `\t${s.participant_number}`,
      'Nilai Wudu': s.wudu_score,
      'Nilai Salat': s.salat_score,
      'Total Nilai': s.total_score,
      'Persentase (%)': s.percentage,
      Status: s.score_status === 'selesai' ? 'Final' : 'Sebagian',
    }))
}

export function exportRankingToExcel(
  data: RankedParticipant[],
  competitionName = 'Lomba MAPSI'
) {
  const rows = toExcelRows(data)
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 8 },  // Ranking
    { wch: 16 }, // Nomor
    { wch: 12 }, // Wudu
    { wch: 12 }, // Salat
    { wch: 12 }, // Total
    { wch: 14 }, // Persen
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ranking')

  const date = new Date().toISOString().slice(0, 10)
  const filename = `${competitionName.replace(/\s+/g, '_')}_Ranking_${date}.xlsx`
  XLSX.writeFile(wb, filename)
}

export function exportRekapToExcel(
  data: ParticipantScore[],
  competitionName = 'Lomba MAPSI'
) {
  const rows = toRekapRows(data)
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai')

  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `${competitionName.replace(/\s+/g, '_')}_Rekap_${date}.xlsx`)
}

export function exportToCSV(
  data: RankedParticipant[] | ParticipantScore[],
  type: 'ranking' | 'rekap',
  competitionName = 'Lomba MAPSI'
) {
  let csv = ''
  if (type === 'ranking') {
    csv = 'Ranking,Nomor Peserta,Nilai Wudu,Nilai Salat,Total Nilai,Persentase (%)\n'
    ;(data as RankedParticipant[]).forEach((r) => {
      csv += `${r.ranking},"${r.participant_number}",${r.wudu_score},${r.salat_score},${r.total_score},${r.percentage}\n`
    })
  } else {
    csv = 'No,Nomor Peserta,Nilai Wudu,Nilai Salat,Total Nilai,Persentase (%),Status\n'
    ;(data as ParticipantScore[])
      .filter((s) => s.score_status !== 'belum')
      .forEach((s, i) => {
        csv += `${i + 1},"${s.participant_number}",${s.wudu_score},${s.salat_score},${s.total_score},${s.percentage},${s.score_status === 'selesai' ? 'Final' : 'Sebagian'}\n`
      })
  }

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const date = new Date().toISOString().slice(0, 10)
  link.download = `${competitionName.replace(/\s+/g, '_')}_${type === 'ranking' ? 'Ranking' : 'Rekap'}_${date}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ─── Export Buttons Component ─────────────────────────────────────────────────

interface ExportButtonsProps {
  type: 'ranking' | 'rekap'
  data: RankedParticipant[] | ParticipantScore[]
  competitionName?: string
  onPrint?: () => void
}

export default function ExportButtons({
  type,
  data,
  competitionName = 'Lomba MAPSI',
  onPrint,
}: ExportButtonsProps) {
  const handleExcel = () => {
    if (type === 'ranking') exportRankingToExcel(data as RankedParticipant[], competitionName)
    else exportRekapToExcel(data as ParticipantScore[], competitionName)
  }

  const handleCSV = () => exportToCSV(data, type, competitionName)

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        icon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
        onClick={handleExcel}
        id={`export-excel-${type}`}
      >
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        icon={<FileText className="h-4 w-4 text-blue-600" />}
        onClick={handleCSV}
        id={`export-csv-${type}`}
      >
        CSV
      </Button>
      {onPrint && (
        <Button
          variant="outline"
          size="sm"
          icon={<Download className="h-4 w-4 text-slate-600" />}
          onClick={onPrint}
          id={`print-${type}`}
        >
          Cetak
        </Button>
      )}
    </div>
  )
}
