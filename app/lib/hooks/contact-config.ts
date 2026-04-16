'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactConfig } from '../api/contact-config';
import { useToken } from './token';

export function useContactConfig() {
  const token = useToken();
  return useQuery({
    queryKey: ['contactConfig'],
    queryFn: () => contactConfig.get(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateContactConfig() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (data: { recipientEmail: string; subjectTemplate?: string; messageTemplate?: string }) =>
      contactConfig.update(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactConfig'] });
    },
  });
}
