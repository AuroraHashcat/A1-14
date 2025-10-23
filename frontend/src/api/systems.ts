import { apiFetch } from './client';

export interface SystemRecord {
  id: string;
  name: string;
  code?: string | null;
  level?: string | null;
  owner?: string | null;
  ownerUsername?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId?: number | null;
  isDefault?: boolean;
  evidenceTotal?: number;
  evidenceParsed?: number;
  reportProgress?: number | null;
}

export interface CreateSystemPayload {
  name: string;
  code?: string;
  level?: string;
  owner?: string;
  description?: string;
}

export async function listSystems(): Promise<SystemRecord[]> {
  return apiFetch<SystemRecord[]>('/systems');
}

export async function createSystem(payload: CreateSystemPayload): Promise<SystemRecord> {
  return apiFetch<SystemRecord>('/systems', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function deleteSystem(systemId: string): Promise<void> {
  await apiFetch<{ id: string }>(`/systems/${systemId}`, {
    method: 'DELETE'
  });
}
