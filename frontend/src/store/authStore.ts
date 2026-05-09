import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  updateUser: (patch: Partial<User>) => void
  logout: () => void
}

function loadUser(): User | null {
  try { return JSON.parse(localStorage.getItem('solv_user') || 'null') } catch { return null }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: loadUser(),
  isAuthenticated: !!localStorage.getItem('access_token'),
  setUser: (user) => {
    if (user) localStorage.setItem('solv_user', JSON.stringify(user))
    else localStorage.removeItem('solv_user')
    set({ user, isAuthenticated: !!user })
  },
  updateUser: (patch) => {
    const current = get().user
    if (!current) return
    const updated = { ...current, ...patch }
    localStorage.setItem('solv_user', JSON.stringify(updated))
    set({ user: updated })
  },
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('solv_user')
    set({ user: null, isAuthenticated: false })
  },
}))
