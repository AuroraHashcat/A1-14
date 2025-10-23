import { fetchEvaluations } from './evaluations';
import { fetchReports } from './reports';
import { fetchEvidences } from './evidences';
import { DashboardStats } from '../types/api';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [evaluations, reports] = await Promise.all([fetchEvaluations(), fetchReports()]);

  const evidenceCounts = await Promise.all(
    evaluations.map(async (evaluation) => {
      try {
        const evidences = await fetchEvidences(evaluation.id);
        return evidences.length;
      } catch (error) {
        console.error('Failed to load evidences for evaluation', evaluation.id, error);
        return 0;
      }
    })
  );

  const totalEvidences = evidenceCounts.reduce((sum, count) => sum + count, 0);

  return {
    totalEvaluations: evaluations.length,
    totalReports: reports.length,
    totalEvidences,
    pendingEvaluations: evaluations.filter((item) => item.status === 'pending').length
  };
}
