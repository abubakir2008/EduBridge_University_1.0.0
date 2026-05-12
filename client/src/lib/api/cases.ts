import client from './client'
import type { Case } from '@/types'

export const apiGetCases = (params?: Record<string, string>) =>
  client.get<Case[]>('/cases', { params }).then((r) => r.data)

export const apiGetCase = (id: string) =>
  client.get<Case>(`/cases/${id}`).then((r) => r.data)

export const apiCreateCase = (body: Partial<Case>) =>
  client.post<Case>('/cases', body).then((r) => r.data)

export const apiUpdateCase = (id: string, body: Partial<Case>) =>
  client.patch<Case>(`/cases/${id}`, body).then((r) => r.data)

export const apiDeleteCase = (id: string) =>
  client.delete(`/cases/${id}`)
