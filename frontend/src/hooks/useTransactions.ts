import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionService } from '../services/transactions'
import type { Transaction, CSVImportResponse } from '../types'

export function useTransactions(budgetId?: string) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', budgetId],
    queryFn: () => transactionService.list(budgetId),
  })
}

export function useImportCSV() {
  const qc = useQueryClient()
  return useMutation<CSVImportResponse, Error, { file: File; budgetId?: string }>({
    mutationFn: ({ file, budgetId }) => transactionService.importCSV(file, budgetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['prediction'] })
    },
  })
}

export function useDeleteTransactions() {
  const qc = useQueryClient()
  return useMutation<{ deleted: number }, Error, string>({
    mutationFn: (budgetId) => transactionService.deleteByBudget(budgetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['prediction'] })
    },
  })
}

export function useGhostSubscriptions() {
  return useQuery<Transaction[]>({
    queryKey: ['ghost-subscriptions'],
    queryFn: transactionService.getGhostSubscriptions,
  })
}
