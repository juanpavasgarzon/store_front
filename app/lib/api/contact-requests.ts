import { apiFetch } from './client';
import type { ContactRequestResponse } from '../types/interactions';

export const contactRequests = {
  create: (token: string, listingId: string, message?: string) =>
    apiFetch<ContactRequestResponse>(`/listings/${listingId}/contact-requests`, {
      method: 'POST',
      body: JSON.stringify({ ...(message ? { message } : {}) }),
      token,
    }),

  updateStatus: (
    token: string,
    listingId: string,
    requestId: string,
    status: 'pending' | 'responded' | 'closed',
  ) =>
    apiFetch<ContactRequestResponse>(
      `/listings/${listingId}/contact-requests/${requestId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }), token },
    ),
};
