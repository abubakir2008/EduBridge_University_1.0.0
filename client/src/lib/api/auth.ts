import client from './client'
import type { LoginResponse, Credentials } from '@/types'

// Tokens are returned as httpOnly cookies; the body only carries the role.
export const apiLogin = (login: string, password: string) =>
  client.post<LoginResponse>('/auth/login', { login, password }).then((r) => r.data)

export const apiRefresh = () =>
  client.post<LoginResponse>('/auth/refresh').then((r) => r.data)

export const apiLogout = () =>
  client.post('/auth/logout', undefined, { validateStatus: () => true })

export const apiResetPassword = (userId: string) =>
  client.post<Credentials>(`/auth/reset-password/${userId}`).then((r) => r.data)
