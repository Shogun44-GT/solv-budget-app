import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { budgetService } from '../services/budgets'
import type { Budget } from '../types'

export function useBudgets() {
  return useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: budgetService.list,
  })
}

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation<Budget, Error, { month: number; year: number; total_amount: number }>({
    mutationFn: ({ month, year, total_amount }) => budgetService.create(month, year, total_amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}
