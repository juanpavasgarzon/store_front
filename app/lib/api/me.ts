import { apiFetch } from './client';
import type { MeProfileResponse } from '../types/users';
import type { PaginationResponse } from '../types/pagination';
import type { ListingResponse } from '../types/listings';
import type { FavoriteResponse, RatingResponse } from '../types/social';
import type { AppointmentResponse, ContactRequestResponse } from '../types/interactions';

export const me = {
  getProfile: (token: string) =>
    apiFetch<MeProfileResponse>('/users/me/profile', { token }),

  updateProfile: (token: string, name: string) =>
    apiFetch<MeProfileResponse>('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
      token,
    }),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    apiFetch<void>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
      token,
    }),

  getListings: (token: string, cursor?: string, limit = 12) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<ListingResponse>>(
      `/users/me/listings?${q.toString()}`,
      { token },
    );
  },

  getFavorites: (token: string, cursor?: string, limit = 12) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<FavoriteResponse>>(
      `/users/me/favorites?${q.toString()}`,
      { token },
    );
  },

  getAppointments: (token: string, cursor?: string, limit = 10) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<AppointmentResponse>>(
      `/users/me/appointments?${q.toString()}`,
      { token },
    );
  },

  getContactRequests: (token: string, cursor?: string, limit = 10) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<ContactRequestResponse>>(
      `/users/me/contact-requests?${q.toString()}`,
      { token },
    );
  },

  getRatings: (token: string, cursor?: string, limit = 10) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<RatingResponse>>(
      `/users/me/ratings?${q.toString()}`,
      { token },
    );
  },
};
