'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { users } from '../api/users';
import { useToken } from './token';

export function useAdminUsers(cursor?: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['adminUsers', cursor ?? ''],
    queryFn: () => users.list(token!, cursor, 20),
    enabled: !!token,
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      users.setActive(token!, id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      users.setRole(token!, id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) => users.delete(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}
