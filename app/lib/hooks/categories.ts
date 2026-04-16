'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { categories } from '../api/categories';

export function usePublicCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categories.listPublic(undefined, 50),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCategoryVariants(categoryId: string | null, token: string | null) {
  return useQuery({
    queryKey: ['categoryVariants', categoryId],
    queryFn: () => categories.getVariants(token!, categoryId!),
    enabled: !!categoryId && !!token,
    staleTime: 5 * 60 * 1000,
  });
}
