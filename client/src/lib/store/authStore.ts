import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiLogin, apiLogout } from '@/lib/api/auth'
import { apiGetMe } from '@/lib/api/users'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  clear: () => void
}

// Tokens live only in httpOnly cookies set by the backend — never in JS/localStorage.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      async login(login, password) {
        set({ isLoading: true })
        try {
          await apiLogin(login, password) // backend sets httpOnly cookies
          const user = await apiGetMe()
          set({ user })
        } finally {
          set({ isLoading: false })
        }
      },

      async logout() {
        await apiLogout().catch(() => {})
        set({ user: null })
      },

      async fetchMe() {
        set({ isLoading: true })
        try {
          const user = await apiGetMe()
          set({ user })
        } catch {
          set({ user: null })
        } finally {
          set({ isLoading: false })
        }
      },

      clear() {
        set({ user: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ user: s.user }),
    }
  )
)
