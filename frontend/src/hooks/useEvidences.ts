import { useQuery } from '@tanstack/react-query';
import { fetchEvaluationEvidences, fetchSystemEvidences } from '../api/evidences';
import { Evidence } from '../types/api';

type EvidenceTarget = { systemId: string } | { evaluationId: number } | undefined;

function resolveKey(target: EvidenceTarget) {
  if (!target) return undefined;
  if ('systemId' in target) return target.systemId;
  return `evaluation-${target.evaluationId}`;
}

export function useEvidences(target?: EvidenceTarget) {
  return useQuery<Evidence[]>({
    queryKey: ['evidences', resolveKey(target)],
    queryFn: () => {
      if (!target) {
        return Promise.resolve([]);
      }
      if ('systemId' in target) {
        return fetchSystemEvidences(target.systemId);
      }
      return fetchEvaluationEvidences(target.evaluationId);
    },
    enabled: Boolean(target),
    refetchInterval: (query) => {
      const list = query.state.data;
      if (!list || list.length === 0) {
        return false;
      }
      return list.some((item) => !item.hasExtractedText) ? 3000 : false;
    },
    refetchIntervalInBackground: true
  });
}
