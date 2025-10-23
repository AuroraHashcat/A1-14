import { apiFetch, API_BASE_URL } from './client';
import { GeneratedReport, ReportDetail, ReportSummary } from '../types/api';
import { FileDownload, extractFilenameFromResponse } from '../utils/download';

type ReportSummaryRecord = {
  id: number;
  uuid: string;
  title: string;
  status: string;
  score: number | null;
  summary: string | null;
  created_at: string;
  evaluation: {
    id: number;
    title: string;
    status: string;
  };
};

type ReportDetailRecord = ReportSummaryRecord & {
  content: string | null;
  recommendations: string[] | null;
  updated_at: string;
  evaluation: ReportSummaryRecord['evaluation'] & {
    uuid: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
};

function mapSummary(record: ReportSummaryRecord): ReportSummary {
  return {
    id: record.id,
    uuid: record.uuid,
    title: record.title,
    status: record.status,
    score: record.score,
    summary: record.summary,
    createdAt: record.created_at,
    evaluation: {
      id: record.evaluation.id,
      title: record.evaluation.title,
      status: record.evaluation.status
    }
  };
}

function mapDetail(record: ReportDetailRecord): ReportDetail {
  return {
    ...mapSummary(record),
    content: record.content,
    recommendations: Array.isArray(record.recommendations) ? record.recommendations : [],
    updatedAt: record.updated_at,
    evaluation: {
      id: record.evaluation.id,
      uuid: record.evaluation.uuid,
      title: record.evaluation.title,
      description: record.evaluation.description,
      status: record.evaluation.status,
      createdAt: record.evaluation.created_at,
      updatedAt: record.evaluation.updated_at
    }
  };
}

export async function fetchReports(): Promise<ReportSummary[]> {
  const data = await apiFetch<ReportSummaryRecord[]>('/reports');
  return data.map(mapSummary);
}

export async function fetchReportDetail(id: number): Promise<ReportDetail> {
  const data = await apiFetch<ReportDetailRecord>(`/reports/${id}`);
  return mapDetail(data);
}

export async function generateSystemReport(systemId: string): Promise<GeneratedReport> {
  return apiFetch<GeneratedReport>(`/systems/${systemId}/reports/generate`, {
    method: 'POST'
  });
}

export async function fetchLatestSystemReport(systemId: string): Promise<ReportDetail | null> {
  try {
    const record = await apiFetch<ReportDetailRecord | null>(`/systems/${systemId}/reports/latest`);
    if (!record) {
      return null;
    }
    return mapDetail(record);
  } catch (err) {
    // On any error, return null so caller can decide to生成
    return null;
  }
}

export async function exportReportDocx(reportId: number): Promise<FileDownload> {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/export`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    let message = '报告导出失败';
    try {
      const payload = await response.json();
      message = payload?.error ?? message;
    } catch (error) {
      console.error('Failed to parse export error response', error);
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const filename = extractFilenameFromResponse(response, `报告_${reportId}.docx`);

  return { blob, filename };
}
