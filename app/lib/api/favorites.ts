import { apiFetch } from './client';
import type { FavoriteResponse, FavoriteCollectionResponse } from '../types/social';

export const favorites = {
  add: (token: string, listingId: string) =>
    apiFetch<FavoriteResponse>(`/listings/${listingId}/favorites`, { method: 'POST', token }),

  remove: (token: string, listingId: string) =>
    apiFetch<void>(`/listings/${listingId}/favorites`, { method: 'DELETE', token }),

  getCollections: (token: string) =>
    apiFetch<FavoriteCollectionResponse[]>('/favorites/collections', { token }),

  createCollection: (token: string, name: string) =>
    apiFetch<FavoriteCollectionResponse>('/favorites/collections', {
      method: 'POST', body: JSON.stringify({ name }), token,
    }),

  assignToCollection: (token: string, listingId: string, collectionId: string | null) =>
    apiFetch<void>(`/favorites/collections/${listingId}/collection`, {
      method: 'PATCH', body: JSON.stringify({ collectionId }), token,
    }),

  deleteCollection: (token: string, collectionId: string) =>
    apiFetch<void>(`/favorites/collections/${collectionId}`, { method: 'DELETE', token }),
};
