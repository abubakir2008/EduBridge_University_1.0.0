import client from './client'
import type { User, Credentials } from '@/types'

export const apiGetMe = () => client.get<User>('/users/me').then((r) => r.data)

export const apiGetUser = (id: string) =>
  client.get<User>(`/users/${id}`).then((r) => r.data)

export const apiGetUsers = (params?: Record<string, string>) =>
  client.get<User[]>('/users', { params }).then((r) => r.data)

export const apiCreateUser = (body: {
  full_name: string
  phone: string
  email?: string
  citizenship?: string
}) => client.post<Credentials>('/users', body).then((r) => r.data)

export const apiUpdateUser = (id: string, body: Partial<User>) =>
  client.patch<User>(`/users/${id}`, body).then((r) => r.data)

export const apiUpdateUserStatus = (id: string, status: string) =>
  client.patch<User>(`/users/${id}/status`, { account_status: status }).then((r) => r.data)
