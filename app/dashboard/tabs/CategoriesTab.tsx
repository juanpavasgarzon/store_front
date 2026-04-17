'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { categories } from '../../lib/api';
import { useToken } from '../../lib/hooks/token';
import CategoriesAdmin from '../../admin/categories/CategoriesAdmin';
import { Button } from '@/components/ui/button';

export default function CategoriesTab() {
  const [createOpen, setCreateOpen] = useState(false);
  const token = useToken();

  const { data: categoriesData } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => categories.list(token!, undefined, 100),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
  const count = categoriesData?.data?.length ?? 0;

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <p className="text-[14px] text-muted-foreground">
          {count} categoría{count !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Nueva categoría
        </Button>
      </div>
      <CategoriesAdmin
        embedded
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
      />
    </>
  );
}
