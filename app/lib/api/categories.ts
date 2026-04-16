import { apiFetch } from './client';
import type { CategoryResponse, CategoryAttributeResponse } from '../types/categories';
import type { PaginationResponse } from '../types/pagination';

export const categories = {
  listPublic: (cursor?: string, limit = 50) => {
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) { query.set('cursor', cursor); }
    return apiFetch<PaginationResponse<CategoryResponse>>(`/categories/public?${query.toString()}`);
  },

  list: (token: string, cursor?: string, limit = 50) => {
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) { query.set('cursor', cursor); }
    return apiFetch<PaginationResponse<CategoryResponse>>(`/categories?${query.toString()}`, { token });
  },

  get: (token: string, id: string) =>
    apiFetch<CategoryResponse>(`/categories/${id}`, { token }),

  create: (token: string, data: object) =>
    apiFetch<CategoryResponse>('/categories', { method: 'POST', body: JSON.stringify(data), token }),

  update: (token: string, id: string, data: object) =>
    apiFetch<CategoryResponse>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),

  delete: (token: string, id: string) =>
    apiFetch<void>(`/categories/${id}`, { method: 'DELETE', token }),

  // ── Attributes ──────────────────────────────────────────────────────────────

  listAttributes: (categoryId: string) =>
    apiFetch<CategoryAttributeResponse[]>(`/categories/${categoryId}/attributes`),

  createAttribute: (token: string, categoryId: string, data: object) =>
    apiFetch<CategoryAttributeResponse>(`/categories/${categoryId}/attributes`, {
      method: 'POST', body: JSON.stringify(data), token,
    }),

  updateAttribute: (token: string, categoryId: string, attributeId: string, data: object) =>
    apiFetch<CategoryAttributeResponse>(`/categories/${categoryId}/attributes/${attributeId}`, {
      method: 'PATCH', body: JSON.stringify(data), token,
    }),

  deleteAttribute: (token: string, categoryId: string, attributeId: string) =>
    apiFetch<void>(`/categories/${categoryId}/attributes/${attributeId}`, {
      method: 'DELETE', token,
    }),
};
