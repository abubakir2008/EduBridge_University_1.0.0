import client from './client'
import type { TokenResponse, Credentials } from '@/types'

export const apiLogin = (login: string, password: string) =>
  client.post<TokenResponse>('/auth/login', { login, password }).then((r) => r.data)

export const apiRefresh = (refresh_token: string) =>
  client.post<TokenResponse>('/auth/refresh', { refresh_token }).then((r) => r.data)

export const apiLogout = (refresh_token: string) =>
  client.post('/auth/logout', { refresh_token }, { validateStatus: () => true })

export const apiResetPassword = (userId: string) =>
  client.post<Credentials>(`/auth/reset-password/${userId}`).then((r) => r.data)
