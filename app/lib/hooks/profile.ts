'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { me } from '../api/me';
import { clearTokens } from '../api/client';
import { useToken } from './token';

interface UpdateProfilePayload {
  name: string;
  phone?: string | null;
  city?: string | null;
}

export function useProfile() {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      if (!token) return null;
      try {
        const p = await me.getProfile(token);
        return {
          id: p.id,
          name: p.name,
          role: p.role,
          email: p.email,
          permissions: p.permissions ?? [],
          phone: p.phone ?? null,
          city: p.city ?? null,
        };
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

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => me.updateProfile(token!, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.profile, {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        permissions: updated.permissions ?? [],
        phone: updated.phone ?? null,
        city: updated.city ?? null,
      });
    },
  });
}
