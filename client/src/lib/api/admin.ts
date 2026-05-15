import client from './client'
import type { AdminDashboardSummary, AdminStudentRow } from '@/types'

export const apiGetDashboard = () =>
  client.get<AdminDashboardSummary>('/admin/dashboard').then((r) => r.data)

export const apiGetOverdueStudents = () =>
  client.get<AdminStudentRow[]>('/admin/dashboard/overdue').then((r) => r.data)

export const apiGetStudentRows = () =>
  client.get<AdminStudentRow[]>('/admin/dashboard/students').then((r) => r.data)

export const apiGetMonthlyStats = () =>
  client.get<{ month: string; students: number; leads: number }[]>('/admin/dashboard/monthly').then((r) => r.data)

export interface LeadHistoryEntry {
  id: string
  status: string
  created_at: string
}

export const apiGetLeadHistory = (leadId: string) =>
  client.get<LeadHistoryEntry[]>(`/leads/${leadId}/history`).then((r) => r.data)

export const apiSendBulkNotification = (userIds: string[], message: string) =>
  Promise.all(
    userIds.map((user_id) =>
      client.post('/admin/notifications/send', { user_id, message })
    )
  )
