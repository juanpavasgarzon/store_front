import { apiFetch } from './client';
import type { AppointmentResponse } from '../types/interactions';
import type { PaginationResponse } from '../types/pagination';

export const appointments = {
  list: (token: string, listingId: string, cursor?: string) => {
    const q = new URLSearchParams();
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<AppointmentResponse>>(
      `/listings/${listingId}/calendar?${q.toString()}`,
      { token },
    );
  },

  create: (token: string, listingId: string, scheduledAt: string, notes?: string) =>
    apiFetch<AppointmentResponse>(`/listings/${listingId}/calendar`, {
      method: 'POST',
      body: JSON.stringify({ scheduledAt, ...(notes ? { notes } : {}) }),
      token,
    }),

  update: (token: string, listingId: string, appointmentId: string, data: object) =>
    apiFetch<AppointmentResponse>(`/listings/${listingId}/calendar/${appointmentId}`, {
      method: 'PATCH', body: JSON.stringify(data), token,
    }),

  delete: (token: string, listingId: string, appointmentId: string) =>
    apiFetch<void>(`/listings/${listingId}/calendar/${appointmentId}`, { method: 'DELETE', token }),
};
