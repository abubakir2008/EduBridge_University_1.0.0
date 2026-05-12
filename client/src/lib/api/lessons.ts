import client from './client'
import type { Lesson } from '@/types'

export const apiGetLesson = (id: string) =>
  client.get<Lesson>(`/lessons/${id}`).then((r) => r.data)

export const apiGetLessons = (params?: Record<string, string>) =>
  client.get<Lesson[]>('/lessons', { params }).then((r) => r.data)

export const apiCreateLesson = (body: Partial<Lesson>) =>
  client.post<Lesson>('/lessons', body).then((r) => r.data)

export const apiUpdateLesson = (id: string, body: Partial<Lesson>) =>
  client.patch<Lesson>(`/lessons/${id}`, body).then((r) => r.data)

export const apiDeleteLesson = (id: string) =>
  client.delete(`/lessons/${id}`)
