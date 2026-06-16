import { API_BASE_URL } from '@/lib/constants';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Базовый fetch-клиент с обработкой ошибок */
async function baseFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text().catch(() => response.statusText);
    }
    throw new ApiError(
      response.status,
      `HTTP ${response.status}: ${response.statusText}`,
      detail,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => baseFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    baseFetch<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  postForm: <T>(path: string, form: FormData) =>
    baseFetch<T>(path, {
      method: 'POST',
      body: form,
    }),
};