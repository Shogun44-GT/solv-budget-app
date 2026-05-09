import api from './api'
import type { Transaction, CSVImportResponse } from '../types'

export const transactionService = {
  async list(budget_id?: string): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>('/api/v1/transactions/', {
      params: budget_id ? { budget_id } : {},
    })
    return data
  },

  async importCSV(file: File, budget_id?: string): Promise<CSVImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (budget_id) formData.append('budget_id', budget_id)
    const { data } = await api.post<CSVImportResponse>('/api/v1/transactions/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async getGhostSubscriptions(): Promise<Transaction[]> {
    const { data } = await api.get<Transaction[]>('/api/v1/transactions/ghost-subscriptions')
    return data
  },

  async deleteByBudget(budget_id: string): Promise<{ deleted: number }> {
    const { data } = await api.delete<{ deleted: number }>(`/api/v1/transactions/by-budget/${budget_id}`)
    return data
  },
}
