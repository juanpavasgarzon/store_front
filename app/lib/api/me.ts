import { apiFetch } from './client';
import type { MeProfileResponse } from '../types/users';
import type { PaginationResponse } from '../types/pagination';
import type { ListingResponse } from '../types/listings';
import type { FavoriteResponse } from '../types/social';
import type { ContactRequestResponse } from '../types/interactions';

interface UpdateProfilePayload {
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
  city?: string | null;
}

export const me = {
  getProfile: (token: string) =>
    apiFetch<MeProfileResponse>('/users/me/profile', { token }),

  updateProfile: (token: string, payload: UpdateProfilePayload) =>
    apiFetch<MeProfileResponse>('/users/me/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
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

  getContactRequests: (token: string, cursor?: string, limit = 10) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<ContactRequestResponse>>(
      `/users/me/contact-requests?${q.toString()}`,
      { token },
    );
  },

  getReceivedContactRequests: (token: string, cursor?: string, limit = 10) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<ContactRequestResponse>>(
      `/users/me/received-contact-requests?${q.toString()}`,
      { token },
    );
  },
};
