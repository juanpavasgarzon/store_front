// Backend (NestJS) runs on port 3000 — Next.js itself is on 3001.
// NEXT_PUBLIC_API_URL must always be set in .env.local.
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '');

// ─── Token helpers (client-side only) ────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// ─── Media URL resolver ───────────────────────────────────────────────────────

/**
 * Converts a backend-relative photo path like "/api/v1/listings/{id}/photos/{file}"
 * into a fully-qualified URL. Already-absolute URLs are returned unchanged.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Normalize legacy URLs stored without the /v1 version segment (e.g. /api/listings/…)
  const normalized = url.startsWith('/api/listings/')
    ? url.replace('/api/listings/', '/api/v1/listings/')
    : url;
  try {
    return `${new URL(BASE_URL).origin}${normalized}`;
  } catch {
    return normalized;
  }
}

// ─── Structured API error ─────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Maps HTTP status codes to user-friendly messages in Spanish. */
export function humanizeApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400) return err.message || 'Los datos enviados no son válidos.';
    if (err.status === 401) return 'Debes iniciar sesión para continuar.';
    if (err.status === 403) return 'No tienes permisos para realizar esta acción.';
    if (err.status === 404) return 'El recurso solicitado no existe.';
    if (err.status === 409) return err.message || 'Ya existe un elemento con estos datos.';
    if (err.status >= 500) return 'Error del servidor. Intenta de nuevo más tarde.';
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido.';
}

// ─── Core fetcher ─────────────────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; skipContentType?: boolean } = {},
): Promise<T> {
  const { token, skipContentType, headers: _headers, ...rest } = options;
  const headers: Record<string, string> = {
    ...(skipContentType ? {} : { 'Content-Type': 'application/json' }),
    ...(_headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const b = body as { message?: string | string[]; error?: string };
    const raw = Array.isArray(b.message) ? b.message.join('; ') : (b.message ?? b.error ?? res.statusText);
    throw new ApiError(res.status, raw, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
