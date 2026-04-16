const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

// ─── Token helpers (client-side only) ────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  document.cookie = `accessToken=${accessToken}; path=/; SameSite=Lax; max-age=${7 * 24 * 3600}`;
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  document.cookie = 'accessToken=; path=/; max-age=0';
}

// ─── Media URL resolver ───────────────────────────────────────────────────────

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
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

// ─── Token refresh ────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function attemptTokenRefresh(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        return null;
      }
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearTokens();
        return null;
      }
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      clearTokens();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

// ─── Core fetcher ─────────────────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; skipContentType?: boolean; _retry?: boolean } = {},
): Promise<T> {
  const { token, skipContentType, _retry, headers: _headers, ...rest } = options;
  const headers: Record<string, string> = {
    ...(skipContentType ? {} : { 'Content-Type': 'application/json' }),
    ...(_headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  if (res.status === 401 && !_retry && token) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      return apiFetch<T>(path, { ...options, token: newToken, _retry: true });
    }
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    throw new ApiError(401, 'Sesión expirada. Por favor inicia sesión nuevamente.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const b = body as { message?: string | string[]; error?: string };
    const raw = Array.isArray(b.message) ? b.message.join('; ') : (b.message ?? b.error ?? res.statusText);
    throw new ApiError(res.status, raw, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
