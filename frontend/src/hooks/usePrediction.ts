import { useQuery, useMutation } from '@tanstack/react-query'
import { budgetService } from '../services/budgets'
import type { PredictionResponse, WhatIfResponse } from '../types'

export function usePrediction(budgetId: string | null) {
  return useQuery<PredictionResponse>({
    queryKey: ['prediction', budgetId],
    queryFn: () => budgetService.computePrediction(budgetId!),
    enabled: !!budgetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useWhatIf() {
  return useMutation<WhatIfResponse, Error, { budgetId: string; reductions: Record<string, number> }>({
    mutationFn: ({ budgetId, reductions }) => budgetService.simulateWhatIf(budgetId, reductions),
  })
}
