import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recommendationService } from '../services/recommendations'

export function useAlternatives(categories: string[]) {
  return useQuery({
    queryKey: ['alternatives', categories],
    queryFn: () => recommendationService.getAlternatives(categories),
    enabled: categories.length > 0,
    staleTime: 10 * 60 * 1000,
  })
}

export function useMealPrep() {
  return useQuery({
    queryKey: ['meal-prep'],
    queryFn: recommendationService.getMealPrep,
    staleTime: 60 * 60 * 1000, // 1h
  })
}

export function useNotifications() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: recommendationService.getNotifications,
    refetchInterval: 5 * 60 * 1000, // Toutes les 5 min
  })

  const markRead = useMutation({
    mutationFn: recommendationService.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return { ...query, markRead }
}
