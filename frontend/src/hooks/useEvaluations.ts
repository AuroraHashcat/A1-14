import { useQuery } from '@tanstack/react-query';
import { fetchEvaluationById, fetchEvaluations } from '../api/evaluations';
import { Evaluation } from '../types/api';

export function useEvaluations() {
  return useQuery<Evaluation[]>({
    queryKey: ['evaluations'],
    queryFn: fetchEvaluations
  });
}

export function useEvaluationDetail(id?: number) {
  return useQuery<Evaluation>({
    queryKey: ['evaluation', id],
    queryFn: () => fetchEvaluationById(id as number),
    enabled: typeof id === 'number'
  });
}
