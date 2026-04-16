'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { me } from '../api/me';
import { contactRequests } from '../api/contact-requests';
import { useToken } from './token';

export function useMyContactRequests(cursor?: string) {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.myContactRequests(cursor),
    queryFn: () => me.getContactRequests(token!, cursor, 10),
    enabled: !!token,
  });
}

export function useCreateContactRequest(listingId: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (message?: string) => contactRequests.create(token!, listingId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myContactRequests'] });
    },
  });
}

export function useReceivedContactRequests(cursor?: string) {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.myReceivedContactRequests(cursor),
    queryFn: () => me.getReceivedContactRequests(token!, cursor, 10),
    enabled: !!token,
  });
}
