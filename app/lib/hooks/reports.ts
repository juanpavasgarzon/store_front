'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reports } from '../api/reports';
import { useToken } from './token';
import type { ReportReason, ReportStatus } from '../types/reports';

export function useCreateReport(listingId: string) {
  const token = useToken();
  return useMutation({
    mutationFn: ({ reason, details }: { reason: ReportReason; details?: string }) =>
      reports.create(token!, listingId, reason, details),
  });
}

export function useAdminReports(cursor?: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['adminReports', cursor ?? ''],
    queryFn: () => reports.list(token!, cursor, 20),
    enabled: !!token,
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) =>
      reports.updateStatus(token!, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
    },
  });
}
