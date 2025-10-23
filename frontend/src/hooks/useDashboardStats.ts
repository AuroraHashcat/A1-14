import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../api/stats';
import { DashboardStats } from '../types/api';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000
  });
}
