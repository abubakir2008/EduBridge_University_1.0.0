import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function deadlineLabel(status?: string, daysLeft?: number): string {
  if (!status) return ''
  if (status === 'overdue') return 'Просрочено'
  if (status === 'at_risk') return `Осталось ${daysLeft} дн.`
  return `Осталось ${daysLeft} дн.`
}
