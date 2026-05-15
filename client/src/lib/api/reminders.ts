import client from './client'

export interface Reminder {
  id: string
  text: string
  student_id: string | null
  student_name: string | null
  due_date: string | null
  is_done: boolean
  created_at: string
}

export const apiGetReminders = () =>
  client.get<Reminder[]>('/admin/reminders').then((r) => r.data)

export const apiCreateReminder = (body: {
  text: string
  student_id?: string | null
  due_date?: string | null
}) => client.post<Reminder>('/admin/reminders', body).then((r) => r.data)

export const apiToggleReminder = (id: string) =>
  client.patch<Reminder>(`/admin/reminders/${id}/done`).then((r) => r.data)

export const apiDeleteReminder = (id: string) =>
  client.delete(`/admin/reminders/${id}`)
