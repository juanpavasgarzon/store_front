'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { me } from '../api/me';
import { favorites } from '../api/favorites';
import { useToken } from './token';

export function useMyFavorites(cursor?: string) {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.myFavorites(cursor),
    queryFn: () => me.getFavorites(token!, cursor, 12),
    enabled: !!token,
  });
}

export function useAddFavorite(listingId: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: () => favorites.add(token!, listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
    },
  });
}

export function useRemoveFavorite(listingId: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: () => favorites.remove(token!, listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });
    },
  });
}
