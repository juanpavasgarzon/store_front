'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { me } from '../api/me';
import { appointments } from '../api/appointments';
import { useToken } from './token';

export function useMyAppointments(cursor?: string) {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.myAppointments(cursor),
    queryFn: () => me.getAppointments(token!, cursor, 10),
    enabled: !!token,
  });
}

export function useCreateAppointment(listingId: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: ({ scheduledAt, notes }: { scheduledAt: string; notes?: string }) =>
      appointments.create(token!, listingId, scheduledAt, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
    },
  });
}

export function useUpdateAppointment(listingId: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      appointments.update(token!, listingId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
    },
  });
}

export function useDeleteAppointment(listingId: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) => appointments.delete(token!, listingId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
    },
  });
}
