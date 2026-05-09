import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Budget, Prediction } from '@/types'

interface AppStore {
  user: User | null
  token: string | null
  currentBudget: Budget | null
  prediction: Prediction | null
  whatIfReductions: Record<string, number>  // category -> percentage

  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setCurrentBudget: (budget: Budget | null) => void
  setPrediction: (prediction: Prediction | null) => void
  setWhatIfReduction: (category: string, pct: number) => void
  resetWhatIf: () => void
  logout: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      currentBudget: null,
      prediction: null,
      whatIfReductions: {},

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setCurrentBudget: (budget) => set({ currentBudget: budget }),
      setPrediction: (prediction) => set({ prediction }),
      setWhatIfReduction: (category, pct) =>
        set((s) => ({ whatIfReductions: { ...s.whatIfReductions, [category]: pct } })),
      resetWhatIf: () => set({ whatIfReductions: {} }),
      logout: () => set({ user: null, token: null, currentBudget: null, prediction: null }),
    }),
    { name: 'coach-budget-store' }
  )
)
