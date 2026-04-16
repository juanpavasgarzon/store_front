import { apiFetch } from './client';
import type { UserResponse } from '../types/users';
import type { PaginationResponse } from '../types/pagination';

export const users = {
  list: (token: string, cursor?: string, limit = 20) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<UserResponse>>(`/users?${q.toString()}`, { token });
  },

  setActive: (token: string, id: string, isActive: boolean) =>
    apiFetch<UserResponse>(`/users/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
      token,
    }),

  setRole: (token: string, id: string, role: string) =>
    apiFetch<UserResponse>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
      token,
    }),

  delete: (token: string, id: string) =>
    apiFetch<void>(`/users/${id}`, { method: 'DELETE', token }),
};
