import { apiFetch } from './client';
import type { FavoriteResponse } from '../types/social';

export const favorites = {
  add: (token: string, listingId: string) =>
    apiFetch<FavoriteResponse>(`/listings/${listingId}/favorites`, { method: 'POST', token }),

  remove: (token: string, listingId: string) =>
    apiFetch<void>(`/listings/${listingId}/favorites`, { method: 'DELETE', token }),
};
