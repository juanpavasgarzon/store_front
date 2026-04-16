'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { legal } from '../api/legal';
import { useToken } from './token';

export function useLegalDocuments() {
  return useQuery({
    queryKey: ['legal'],
    queryFn: () => legal.list(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useLegalDocument(slug: string) {
  return useQuery({
    queryKey: ['legal', slug],
    queryFn: () => legal.get(slug),
    staleTime: 10 * 60 * 1000,
    enabled: !!slug,
  });
}

export function useUpsertLegalDocument() {
  const queryClient = useQueryClient();
  const token = useToken();
  return useMutation({
    mutationFn: (data: { slug: string; title: string; content: string }) =>
      legal.upsert(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal'] });
    },
  });
}
