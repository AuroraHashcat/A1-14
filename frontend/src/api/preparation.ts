import { apiFetch } from './client';
import { ProjectInfo } from '../types/project';

export interface PreparationResponse {
  systemId: string;
  projectInfo: ProjectInfo | null;
}

export interface SavePreparationPayload {
  projectInfo: ProjectInfo;
}

export async function getSystemPreparation(systemId: string): Promise<PreparationResponse> {
  return apiFetch<PreparationResponse>(`/systems/${systemId}/preparation`);
}

export async function saveSystemPreparation(systemId: string, payload: SavePreparationPayload): Promise<PreparationResponse> {
  return apiFetch<PreparationResponse>(`/systems/${systemId}/preparation`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
