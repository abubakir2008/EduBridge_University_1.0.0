import client from './client'
import type { Notification } from '@/types'

export const apiGetNotifications = () =>
  client.get<Notification[]>('/notifications').then((r) => r.data)

export const apiMarkRead = (id: string) =>
  client.patch(`/notifications/${id}/read`).then((r) => r.data)

export const apiSendNotification = (body: {
  user_id: string
  message: string
  channel?: string
}) => client.post('/admin/notifications/send', body).then((r) => r.data)

export const apiGetAllNotifications = () =>
  client.get<Notification[]>('/admin/notifications').then((r) => r.data)
