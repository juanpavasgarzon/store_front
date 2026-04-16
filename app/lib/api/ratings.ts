import { apiFetch } from './client';
import type { RatingResponse, RatingSummaryResponse } from '../types/social';
import type { PaginationResponse } from '../types/pagination';

export const ratings = {
  getSummary: (listingId: string) =>
    apiFetch<RatingSummaryResponse>(`/listings/${listingId}/ratings/summary`),

  getMyRating: (token: string, listingId: string) =>
    apiFetch<{ score: number } | null>(`/listings/${listingId}/ratings/me`, { token }),

  list: (listingId: string, cursor?: string) => {
    const q = new URLSearchParams();
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<RatingResponse>>(
      `/listings/${listingId}/ratings?${q.toString()}`,
    );
  },

  create: (token: string, listingId: string, score: number) =>
    apiFetch<RatingResponse>(`/listings/${listingId}/ratings`, {
      method: 'POST',
      body: JSON.stringify({ score }),
      token,
    }),
};
