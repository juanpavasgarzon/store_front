'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { comments } from '../api/comments';
import { useToken } from './token';

export function useListingComments(listingId: string, cursor?: string) {
  return useQuery({
    queryKey: queryKeys.listingComments(listingId, cursor),
    queryFn: () => comments.list(listingId, cursor, 10),
    staleTime: 30 * 1000,
  });
}

export function useCreateComment(listingId: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (content: string) => comments.create(token!, listingId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', listingId] });
    },
  });
}

export function useDeleteComment(listingId: string) {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (commentId: string) => comments.delete(token!, listingId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', listingId] });
    },
  });
}
