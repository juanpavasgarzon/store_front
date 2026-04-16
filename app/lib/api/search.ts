import { apiFetch } from './client';
import type { SearchResult } from '../types/search';

export const search = {
  // type param: 'listing' | 'category' | 'listing,category'
  query: (q: string, type?: string) => {
    const params = new URLSearchParams({ q });
    if (type) params.set('type', type);
    return apiFetch<SearchResult>(`/search?${params.toString()}`);
  },
};
