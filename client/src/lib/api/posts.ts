import client from './client'
import type { Post, PostListItem } from '@/types'

// Публичные (через браузерный клиент — для админки/клиентских компонентов)
export const apiGetPosts = (category?: string) =>
  client.get<PostListItem[]>('/posts', { params: category ? { category } : {} }).then((r) => r.data)

export const apiGetPost = (slug: string) =>
  client.get<Post>(`/posts/${slug}`).then((r) => r.data)

// Админские
export const apiGetAllPosts = () =>
  client.get<Post[]>('/posts/admin/all').then((r) => r.data)

export const apiCreatePost = (body: Partial<Post>) =>
  client.post<Post>('/posts', body).then((r) => r.data)

export const apiUpdatePost = (id: string, body: Partial<Post>) =>
  client.patch<Post>(`/posts/admin/${id}`, body).then((r) => r.data)

export const apiDeletePost = (id: string) =>
  client.delete(`/posts/admin/${id}`)

export const apiUploadPostCover = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<{ file_id: string }>('/posts/cover', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

// Публичная обложка (без авторизации) — работает и в SSR
export const getPostCoverUrl = (fileId: string) => `/api/posts/cover/${fileId}`
