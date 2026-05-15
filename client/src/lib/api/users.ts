import client from './client'
import type { User, Credentials } from '@/types'

export const apiGetMe = () => client.get<User>('/users/me').then((r) => r.data)

export const apiGetUser = (id: string) =>
  client.get<User>(`/users/${id}`).then((r) => r.data)

export interface PaginatedUsers {
  items: User[]
  total: number
  page: number
  pages: number
}

export const apiGetUsers = (params?: { page?: number; per_page?: number; search?: string }) =>
  client.get<PaginatedUsers>('/users', { params }).then((r) => r.data)

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

export const apiDeleteUser = (id: string) =>
  client.delete(`/users/${id}`)

export const apiUploadContract = (userId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post(
    `/users/${userId}/contract`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
}

export const apiGetContractBlob = (userId: string) =>
  client.get(`/users/${userId}/contract`, { responseType: 'blob' }).then((r) => ({
    blob: r.data as Blob,
    type: (r.headers['content-type'] as string) || 'application/octet-stream',
    filename: (r.headers['content-disposition'] as string | undefined)
      ?.match(/filename="?([^"]+)"?/)?.[1] ?? 'contract',
  }))

// Admin notes
export interface AdminNote {
  id: string
  user_id: string
  admin_id: string | null
  text: string
  created_at: string
}

export const apiGetNotes = (userId: string) =>
  client.get<AdminNote[]>(`/users/${userId}/notes`).then((r) => r.data)

export const apiCreateNote = (userId: string, text: string) =>
  client.post<AdminNote>(`/users/${userId}/notes`, { text }).then((r) => r.data)

export const apiDeleteNote = (userId: string, noteId: string) =>
  client.delete(`/users/${userId}/notes/${noteId}`)

// Индивидуальные дедлайны студента по этапам
export const apiGetStageDeadlines = (userId: string) =>
  client.get<Record<string, string>>(`/training/${userId}/stage-deadlines`).then((r) => r.data)

export const apiSetStageDeadline = (userId: string, stageId: string, deadline: string) =>
  client.put(`/training/${userId}/stage-deadlines/${stageId}`, { deadline }).then((r) => r.data)

export const apiDeleteStageDeadline = (userId: string, stageId: string) =>
  client.delete(`/training/${userId}/stage-deadlines/${stageId}`)
