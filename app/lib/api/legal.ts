import { apiFetch } from './client';
import type { LegalDocument } from '../types/legal';

export const legal = {
  list: () => apiFetch<LegalDocument[]>('/legal'),

  get: (slug: string) => apiFetch<LegalDocument>(`/legal/${slug}`),

  upsert: (token: string, data: { slug: string; title: string; content: string }) =>
    apiFetch<LegalDocument>('/legal', { method: 'POST', body: JSON.stringify(data), token }),
};
