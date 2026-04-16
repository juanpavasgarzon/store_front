'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { categories } from '../api/categories';
import { useToken } from './token';

export function usePublicCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categories.listPublic(undefined, 50),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoryAttributes(categoryId: string | null) {
  return useQuery({
    queryKey: ['categoryAttributes', categoryId],
    queryFn: () => categories.listAttributes(categoryId!),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategoryAttribute(categoryId: string) {
  const queryClient = useQueryClient();
  const token = useToken();

  return useMutation({
    mutationFn: (data: object) => categories.createAttribute(token!, categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoryAttributes', categoryId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
    },
  });
}

export function useUpdateCategoryAttribute(categoryId: string) {
  const queryClient = useQueryClient();
  const token = useToken();

  return useMutation({
    mutationFn: ({ attributeId, data }: { attributeId: string; data: object }) =>
      categories.updateAttribute(token!, categoryId, attributeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoryAttributes', categoryId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
    },
  });
}

export function useDeleteCategoryAttribute(categoryId: string) {
  const queryClient = useQueryClient();
  const token = useToken();

  return useMutation({
    mutationFn: (attributeId: string) =>
      categories.deleteAttribute(token!, categoryId, attributeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoryAttributes', categoryId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
    },
  });
}
