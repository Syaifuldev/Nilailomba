import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateParticipantNumbers(
  count: number,
  startFrom: number = 1
): string[] {
  const numbers: string[] = []
  for (let i = startFrom; i < startFrom + count; i++) {
    numbers.push(String(i).padStart(3, '0'))
  }
  return numbers
}

export function formatParticipantNumber(num: number): string {
  return String(num).padStart(3, '0')
}

export const judgingCategoryLabel: Record<string, string> = {
  wudu: 'Wudu',
  salat: 'Salat',
  wudu_dan_salat: 'Wudu & Salat',
}

export const assessmentStatusLabel: Record<string, string> = {
  belum_dinilai: 'Belum Dinilai',
  sedang_dinilai: 'Sedang Dinilai',
  sebagian_selesai: 'Sebagian Selesai',
  selesai: 'Selesai',
  final: 'Final',
}

export const roleLabel: Record<string, string> = {
  admin: 'Admin',
  juri: 'Juri',
  operator: 'Operator',
}

export const competitionStatusLabel: Record<string, string> = {
  draft: 'Draft',
  active: 'Aktif',
  completed: 'Selesai',
}
