import { apiFetch } from './client';
import { SessionUser } from '../types/api';

export async function fetchSession(): Promise<SessionUser> {
  return apiFetch<SessionUser>('/session');
}

export async function logout(): Promise<void> {
  await apiFetch<{ message: string }>('/logout', { method: 'POST' });
}
