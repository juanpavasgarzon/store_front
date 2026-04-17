import { apiFetch } from './client';
import type { ListingResponse, ListingStatsResponse } from '../types/listings';
import type { PaginationResponse } from '../types/pagination';

export const listings = {
  list: (params: {
    cursor?: string;
    limit?: number;
    search?: string;
    categoryId?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}) => {
    const q = new URLSearchParams();
    if (params.cursor) q.set('cursor', params.cursor);
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    if (params.sort) q.set('sort', params.sort);
    if (params.categoryId) q.set('categoryId', params.categoryId);
    if (params.minPrice != null) q.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) q.set('maxPrice', String(params.maxPrice));
    return apiFetch<PaginationResponse<ListingResponse>>(`/listings?${q.toString()}`);
  },

  get: (id: string) =>
    apiFetch<ListingResponse>(`/listings/${id}`),

  getByCode: (code: string) =>
    apiFetch<ListingResponse>(`/listings/code/${code}`),

  trending: (period: '24h' | '7d' = '7d', limit = 8) =>
    apiFetch<ListingResponse[]>(`/listings/trending?period=${period}&limit=${limit}`),

  create: (token: string, data: object) =>
    apiFetch<ListingResponse>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  update: (token: string, id: string, data: object) =>
    apiFetch<ListingResponse>(`/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    }),

  delete: (token: string, id: string) =>
    apiFetch<void>(`/listings/${id}`, { method: 'DELETE', token }),

  getStats: (token: string, id: string) =>
    apiFetch<ListingStatsResponse>(`/listings/${id}/stats`, { token }),

  uploadPhotos: (token: string, listingId: string, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('photos', f));
    return apiFetch<{ id: string; filename: string; url: string; thumbnailUrl: string | null }[]>(
      `/listings/${listingId}/photos`,
      { method: 'POST', skipContentType: true, body: form, token },
    );
  },

  getPhotos: (listingId: string) =>
    apiFetch<{ id: string; filename: string; url: string; thumbnailUrl: string | null }[]>(
      `/listings/${listingId}/photos`,
    ),

  count: () =>
    apiFetch<{ count: number }>('/listings/count'),

  listByCategory: (categoryId: string, params: { cursor?: string; limit?: number; search?: string; sort?: string; minPrice?: number; maxPrice?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.cursor) q.set('cursor', params.cursor);
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    if (params.sort) q.set('sort', params.sort);
    if (params.minPrice != null) q.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) q.set('maxPrice', String(params.maxPrice));
    return apiFetch<PaginationResponse<ListingResponse>>(`/categories/${categoryId}/listings?${q.toString()}`);
  },
};
