import client from './client'
import type { Lesson } from '@/types'

export const apiGetLesson = (id: string) =>
  client.get<Lesson>(`/lessons/${id}`).then((r) => r.data)

export interface PaginatedLessons {
  items: Lesson[]
  total: number
  page: number
  pages: number
}

export const apiGetLessons = (params?: Record<string, string | number>) =>
  client.get<PaginatedLessons>('/lessons', { params }).then((r) => r.data)

export const apiCreateLesson = (body: Partial<Lesson>) =>
  client.post<Lesson>('/lessons', body).then((r) => r.data)

export const apiUpdateLesson = (id: string, body: Partial<Lesson>) =>
  client.patch<Lesson>(`/lessons/${id}`, body).then((r) => r.data)

export const apiDeleteLesson = (id: string) =>
  client.delete(`/lessons/${id}`)
