import client from './client'
import type { AdminDashboardSummary, AdminStudentRow } from '@/types'

export const apiGetDashboard = () =>
  client.get<AdminDashboardSummary>('/admin/dashboard').then((r) => r.data)

export const apiGetOverdueStudents = () =>
  client.get<AdminStudentRow[]>('/admin/dashboard/overdue').then((r) => r.data)

export const apiGetStudentRows = () =>
  client.get<AdminStudentRow[]>('/admin/dashboard/students').then((r) => r.data)
