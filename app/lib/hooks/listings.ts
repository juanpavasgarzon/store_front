'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { me } from '../api/me';
import { listings } from '../api/listings';
import { useToken } from './token';
import type { ListingResponse } from '../types';

export function useMyListings(cursor?: string) {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.myListings(cursor),
    queryFn: () => me.getListings(token!, cursor, 12),
    enabled: !!token,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (data: object) => listings.create(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (id: string) => listings.delete(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
    },
  });
}

export function useListingStats(listingId: string, enabled = true) {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.listingStats(listingId),
    queryFn: () => listings.getStats(token!, listingId),
    enabled: !!token && enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUploadPhotos(listingId: string) {
  const token = useToken();
  return useMutation({
    mutationFn: (files: File[]) => listings.uploadPhotos(token!, listingId, files),
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => listings.update(token!, id, data),
    onSuccess: (updated: ListingResponse) => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', updated.id] });
    },
  });
}
