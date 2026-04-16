import { apiFetch } from './client';
import type { CategoryResponse, VariantResponse } from '../types/categories';
import type { PaginationResponse } from '../types/pagination';

export const categories = {
  listPublic: (cursor?: string, limit = 50) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<CategoryResponse>>(`/categories/public?${q.toString()}`);
  },

  list: (token: string, cursor?: string, limit = 50) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<CategoryResponse>>(`/categories?${q.toString()}`, { token });
  },

  get: (token: string, id: string) =>
    apiFetch<CategoryResponse>(`/categories/${id}`, { token }),

  create: (token: string, data: object) =>
    apiFetch<CategoryResponse>('/categories', { method: 'POST', body: JSON.stringify(data), token }),

  update: (token: string, id: string, data: object) =>
    apiFetch<CategoryResponse>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),

  delete: (token: string, id: string) =>
    apiFetch<void>(`/categories/${id}`, { method: 'DELETE', token }),

  getVariants: (token: string, categoryId: string) =>
    apiFetch<VariantResponse[]>(`/categories/${categoryId}/variants`, { token }),

  createVariant: (token: string, categoryId: string, data: object) =>
    apiFetch<VariantResponse>(`/categories/${categoryId}/variants`, {
      method: 'POST', body: JSON.stringify(data), token,
    }),

  updateVariant: (token: string, categoryId: string, variantId: string, data: object) =>
    apiFetch<VariantResponse>(`/categories/${categoryId}/variants/${variantId}`, {
      method: 'PATCH', body: JSON.stringify(data), token,
    }),

  deleteVariant: (token: string, categoryId: string, variantId: string) =>
    apiFetch<void>(`/categories/${categoryId}/variants/${variantId}`, { method: 'DELETE', token }),
};
