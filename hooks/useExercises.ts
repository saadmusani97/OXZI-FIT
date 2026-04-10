import { useQuery } from '@tanstack/react-query'
import { fetchExercises, filterExercises } from '../lib/exerciseDb'

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: fetchExercises,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useFilteredExercises(query: string, muscle?: string, equipment?: string) {
  const { data: exercises = [], ...rest } = useExercises()
  const filtered = filterExercises(exercises, query, muscle, equipment)
  return { data: filtered, ...rest }
}
