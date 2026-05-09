import api from './api'

export interface Alternative {
  label: string
  saving_euros: number
  saving_min?: number
  saving_max?: number
  description: string
  effort: 'faible' | 'moyen' | 'élevé'
  url?: string
}

export interface MealPrepRecipe {
  name: string
  cost_per_portion: number
  portions: number
  prep_time: string
  ingredients: string[]
  difficulty: string
  tags: string[]
}

export interface Notification {
  id: string
  title: string
  body: string
  urgency: 'info' | 'warning' | 'critical'
  action?: string
  is_read: boolean
  created_at: string
}

export const recommendationService = {
  async getAlternatives(categories: string[]): Promise<{ categories: Record<string, Alternative[]>; profile: string; total_potential_saving: number }> {
    const { data } = await api.get('/api/v1/recommendations/alternatives', {
      params: { categories: categories.join(',') },
    })
    return data
  },

  async getMealPrep(): Promise<{ recipes: MealPrepRecipe[]; profile: string }> {
    const { data } = await api.get('/api/v1/recommendations/meal-prep')
    return data
  },

  async getNotifications(): Promise<{ notifications: Notification[] }> {
    const { data } = await api.get('/api/v1/recommendations/notifications')
    return data
  },

  async markRead(notifId: string): Promise<void> {
    await api.post(`/api/v1/recommendations/notifications/${notifId}/read`)
  },

  async triggerCheck(budgetId: string): Promise<any> {
    const { data } = await api.post(`/api/v1/recommendations/trigger-check/${budgetId}`)
    return data
  },

  async getDailyPhrase(params: {
    budget_amount: number; total_spent: number; daily_rate: number
    days_elapsed: number; top_category: string; top_amount: number; city: string
  }): Promise<string> {
    const { data } = await api.post('/api/v1/recommendations/daily-phrase', params)
    return data.phrase
  },

  async chat(message: string, budgetContext: Record<string, unknown> = {}): Promise<string> {
    const { data } = await api.post('/api/v1/recommendations/chat', {
      message,
      budget_context: budgetContext,
    })
    return data.response
  },
}
