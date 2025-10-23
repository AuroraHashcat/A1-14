import { API_BASE_URL, apiFetch } from './client';
import { Evidence, EvidenceDetail } from '../types/api';
import { ApiResponse } from '../types/api';

type EvidenceRecord = {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  has_extracted_text: boolean;
  created_at: string;
};

type UploadResponseRecord = {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
};

type EvidenceDetailRecord = EvidenceRecord & {
  extracted_text?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
};

function mapEvidence(record: EvidenceRecord): Evidence {
  return {
    id: record.id,
    filename: record.filename,
    fileType: record.file_type,
    fileSize: record.file_size,
    hasExtractedText: record.has_extracted_text,
    createdAt: record.created_at
  };
}

export async function fetchSystemEvidences(systemId: string): Promise<Evidence[]> {
  const data = await apiFetch<EvidenceRecord[]>(`/systems/${systemId}/evidences`);
  return data.map(mapEvidence);
}

export async function fetchEvaluationEvidences(evaluationId: number): Promise<Evidence[]> {
  const data = await apiFetch<EvidenceRecord[]>(`/evaluations/${evaluationId}/evidences`);
  return data.map(mapEvidence);
}

export const fetchEvidences = fetchEvaluationEvidences;

function mapEvidenceDetail(record: EvidenceDetailRecord): EvidenceDetail {
  return {
    ...mapEvidence(record),
    extractedText: record.extracted_text ?? null,
    summary: record.summary ?? null,
    metadata: record.metadata ?? null
  };
}

export async function uploadEvidence(systemId: string, file: File): Promise<Evidence> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/systems/${systemId}/evidences`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });

  const payload = (await response.json()) as ApiResponse<UploadResponseRecord>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? '文件上传失败');
  }

  return {
    id: payload.data.id,
    filename: payload.data.filename,
    fileType: payload.data.file_type,
    fileSize: payload.data.file_size,
    hasExtractedText: false,
    createdAt: new Date().toISOString()
  };
}

export async function fetchEvidenceDetail(evidenceId: number): Promise<EvidenceDetail> {
  const data = await apiFetch<EvidenceDetailRecord>(`/evidences/${evidenceId}`);
  return mapEvidenceDetail(data);
}

export async function deleteEvidence(evidenceId: number): Promise<void> {
  await apiFetch<{ id: number }>(`/evidences/${evidenceId}`, { method: 'DELETE' });
}
