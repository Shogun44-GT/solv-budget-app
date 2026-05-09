import api from './api'
import type { TokenResponse, User } from '../types'

export const authService = {
  async register(email: string, password: string, full_name?: string, city?: string): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/api/v1/auth/register', { email, password, full_name, city })
    localStorage.setItem('access_token', data.access_token)
    return data
  },

  async login(email: string, password: string): Promise<TokenResponse> {
    const form = new URLSearchParams({ username: email, password })
    const { data } = await api.post<TokenResponse>('/api/v1/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('access_token', data.access_token)
    return data
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/api/v1/auth/me')
    return data
  },

  logout() {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
  },
}
