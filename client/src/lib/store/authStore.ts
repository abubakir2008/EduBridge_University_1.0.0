import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { apiLogin, apiLogout } from '@/lib/api/auth'
import { apiGetMe } from '@/lib/api/users'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  setTokens: (access: string, refresh: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      setTokens(access, refresh) {
        Cookies.set('access_token', access, { expires: 1 })
        Cookies.set('refresh_token', refresh, { expires: 14 })
        set({ accessToken: access, refreshToken: refresh })
      },

      async login(login, password) {
        set({ isLoading: true })
        try {
          const tokens = await apiLogin(login, password)
          get().setTokens(tokens.access_token, tokens.refresh_token)
          const user = await apiGetMe()
          set({ user })
        } finally {
          set({ isLoading: false })
        }
      },

      async logout() {
        const rt = get().refreshToken
        if (rt) await apiLogout(rt).catch(() => {})
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null })
      },

      async fetchMe() {
        set({ isLoading: true })
        try {
          const user = await apiGetMe()
          set({ user })
        } finally {
          set({ isLoading: false })
        }
      },

      clear() {
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
)
