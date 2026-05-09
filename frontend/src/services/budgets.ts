import api from './api'
import type { Budget, PredictionResponse, WhatIfResponse } from '../types'

export const budgetService = {
  async create(month: number, year: number, total_amount: number): Promise<Budget> {
    const { data } = await api.post<Budget>('/api/v1/budgets/', { month, year, total_amount })
    return data
  },

  async list(): Promise<Budget[]> {
    const { data } = await api.get<Budget[]>('/api/v1/budgets/')
    return data
  },

  async computePrediction(budget_id: string): Promise<PredictionResponse> {
    const { data } = await api.post<PredictionResponse>(`/api/v1/predictions/${budget_id}/compute`)
    return data
  },

  async simulateWhatIf(budget_id: string, reductions: Record<string, number>): Promise<WhatIfResponse> {
    const { data } = await api.post<WhatIfResponse>('/api/v1/predictions/whatif', { budget_id, reductions })
    return data
  },
}
