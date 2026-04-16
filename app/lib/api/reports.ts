import { apiFetch } from './client';
import type { ReportReason, ReportResponse, ReportStatus } from '../types/reports';
import type { PaginationResponse } from '../types/pagination';

export const reports = {
  create: (token: string, listingId: string, reason: ReportReason, details?: string) =>
    apiFetch<ReportResponse>(`/listings/${listingId}/reports`, {
      method: 'POST',
      body: JSON.stringify({ reason, ...(details ? { details } : {}) }),
      token,
    }),

  list: (token: string, cursor?: string, limit = 20) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<PaginationResponse<ReportResponse>>(`/reports?${q.toString()}`, { token });
  },

  updateStatus: (token: string, reportId: string, status: ReportStatus) =>
    apiFetch<ReportResponse>(`/reports/${reportId}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }), token,
    }),
};
