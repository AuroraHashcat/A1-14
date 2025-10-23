import { useQuery } from '@tanstack/react-query';
import { fetchReportDetail, fetchReports } from '../api/reports';
import { ReportDetail, ReportSummary } from '../types/api';

export function useReports() {
  return useQuery<ReportSummary[]>({
    queryKey: ['reports'],
    queryFn: fetchReports
  });
}

export function useReportDetail(id?: number) {
  return useQuery<ReportDetail>({
    queryKey: ['report', id],
    queryFn: () => fetchReportDetail(id as number),
    enabled: typeof id === 'number'
  });
}
