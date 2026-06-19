import client from './client'
import type { Category } from '@/types'

export const apiGetCategories = () =>
  client.get<Category[]>('/categories').then((r) => r.data)

export const apiCreateCategory = (body: Partial<Category>) =>
  client.post<Category>('/categories', body).then((r) => r.data)

export const apiUpdateCategory = (id: string, body: Partial<Category>) =>
  client.patch<Category>(`/categories/${id}`, body).then((r) => r.data)

export const apiDeleteCategory = (id: string) =>
  client.delete(`/categories/${id}`)
