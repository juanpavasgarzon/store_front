import { apiFetch } from './client';
import type { CommentResponse } from '../types/social';
import type { PaginationResponse } from '../types/pagination';

export const comments = {
  list: (listingId: string, cursor?: string, limit = 10) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<CommentResponse>>(
      `/listings/${listingId}/comments?${q.toString()}`,
    );
  },

  create: (token: string, listingId: string, content: string) =>
    apiFetch<CommentResponse>(`/listings/${listingId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
      token,
    }),

  delete: (token: string, listingId: string, commentId: string) =>
    apiFetch<void>(`/listings/${listingId}/comments/${commentId}`, {
      method: 'DELETE',
      token,
    }),
};
