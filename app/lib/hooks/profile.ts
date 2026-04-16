'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { me } from '../api/me';
import { clearTokens } from '../api/client';
import { useToken } from './token';
import type { RatingResponse } from '../types/social';

export function useProfile() {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      if (!token) return null;
      try {
        const p = await me.getProfile(token);
        return { name: p.name, role: p.role, email: p.email, id: p.id, permissions: p.permissions ?? [] };
      } catch {
        clearTokens();
        return null;
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useMyRatings(cursor?: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['myRatings', cursor ?? ''] as const,
    queryFn: (): Promise<import('../types/pagination').PaginationResponse<RatingResponse>> =>
      me.getRatings(token!, cursor),
    enabled: !!token,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (name: string) => me.updateProfile(token!, name),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.profile, {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        permissions: updated.permissions ?? [],
      });
    },
  });
}
