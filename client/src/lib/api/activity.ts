import client from './client'

export interface ActivityLogEntry {
  id: string
  admin_name: string
  entity_type: string
  entity_id: string | null
  action: string
  detail: string | null
  created_at: string
}

export const apiGetActivityLog = () =>
  client.get<ActivityLogEntry[]>('/admin/activity').then((r) => r.data)
