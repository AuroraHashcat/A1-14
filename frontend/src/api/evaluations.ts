import { apiFetch } from './client';
import { Evaluation } from '../types/api';

type EvaluationRecord = {
  id: number;
  uuid: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type EvaluationDetailRecord = EvaluationRecord & {
  evidences_count?: number;
  reports_count?: number;
};

function mapEvaluation(record: EvaluationRecord): Evaluation {
  return {
    id: record.id,
    uuid: record.uuid,
    title: record.title,
    description: record.description,
    status: record.status,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export async function fetchEvaluations(): Promise<Evaluation[]> {
  const data = await apiFetch<EvaluationRecord[]>('/evaluations');
  return data.map(mapEvaluation);
}

export async function fetchEvaluationById(id: number): Promise<Evaluation> {
  const data = await apiFetch<EvaluationDetailRecord>(`/evaluations/${id}`);
  return mapEvaluation(data);
}

export async function createEvaluation(payload: { title: string; description?: string }): Promise<Evaluation> {
  const data = await apiFetch<EvaluationRecord>('/evaluations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return mapEvaluation(data);
}

export async function triggerEvaluationProcess(id: number) {
  return apiFetch(`/evaluations/${id}/process`, {
    method: 'POST'
  });
}
