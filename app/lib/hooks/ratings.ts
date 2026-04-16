'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { ratings } from '../api/ratings';
import { useToken } from './token';

export function useRatingSummary(listingId: string) {
  return useQuery({
    queryKey: queryKeys.listingRatingSummary(listingId),
    queryFn: () => ratings.getSummary(listingId),
  });
}

export function useMyRatingForListing(listingId: string) {
  const token = useToken();
  return useQuery({
    queryKey: ['myRatingForListing', listingId],
    queryFn: () => ratings.getMyRating(token!, listingId),
    enabled: !!token,
  });
}

export function useCreateRating(listingId: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (score: number) => ratings.create(token!, listingId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listingRatingSummary(listingId) });
      queryClient.invalidateQueries({ queryKey: ['myRatingForListing', listingId] });
    },
  });
}
