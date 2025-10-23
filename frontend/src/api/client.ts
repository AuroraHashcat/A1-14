import { ApiResponse } from '../types/api';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch (error) {
    console.error('Failed to parse API response', error);
    throw new Error('无法解析服务端响应');
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...(init.headers ?? {})
    }
  });

  const payload = await parseJson<T>(response);

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? '服务请求失败');
  }

  return payload.data;
}

export function buildFormBody(data: Record<string, string>) {
  return new URLSearchParams(data).toString();
}

export async function submitForm<T>(path: string, body: Record<string, string>) {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: buildFormBody(body),
    redirect: 'follow'
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch (error) {
    // Some responses might not include JSON when failing; ignore parsing errors here.
  }

  if (!response.ok || (payload && !payload.success)) {
    const message = payload?.error ?? '请求失败';
    throw new Error(message);
  }

  return payload ? payload.data : (undefined as T);
}

export { API_BASE_URL };
