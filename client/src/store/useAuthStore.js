import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      setToken: (accessToken) => set({ accessToken }),

      login: async (email, password) => {
        const { data } = await authApi.login({ email, password })
        set({ user: data.user, accessToken: data.accessToken })
        return data.user
      },

      register: async (name, email, password) => {
        const { data } = await authApi.register({ name, email, password })
        set({ user: data.user, accessToken: data.accessToken })
        return data.user
      },

      logout: async () => {
        try { await authApi.logout() } catch {}
        set({ user: null, accessToken: null })
      },
    }),
    {
      name: 'auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    }
  )
)
