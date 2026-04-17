'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categories } from '../../lib/api';
import { useProfile } from '../../lib/hooks';
import { useToken } from '../../lib/hooks/token';
import { sileo } from 'sileo';
import { CategoryRow } from './components/CategoryRow';
import { AttributeForm } from './components/AttributeForm';
import EmptyState from '../../components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { LayoutGrid, Plus } from 'lucide-react';

const labelClass = 'text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground';

export default function CategoriesAdmin({
  embedded,
  createOpen: externalCreateOpen,
  onCreateOpenChange: onExternalCreateOpenChange,
}: {
  embedded?: boolean;
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
} = {}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const token = useToken();
  const queryClient = useQueryClient();

  const isControlled = externalCreateOpen !== undefined;
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const createOpen = isControlled ? externalCreateOpen! : internalCreateOpen;
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const handleCreateOpenChange = (open: boolean) => {
    if (!isControlled) setInternalCreateOpen(open);
    onExternalCreateOpenChange?.(open);
    if (!open) { setNewName(''); setNewSlug(''); }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (!embedded && mounted && !profileLoading && (!profile || !isAdmin)) {
      router.push('/');
    }
  }, [embedded, mounted, profileLoading, profile, isAdmin, router]);

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => categories.list(token!, undefined, 100),
    enabled: !!token && !!isAdmin,
  });

  const createCategory = useMutation({
    mutationFn: (data: object) => categories.create(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCreateOpenChange(false);
      sileo.success({ title: 'Categoría creada', description: `"${newName}" lista para usar` });
    },
    onError: (error) => sileo.error({ title: 'Error al crear', description: (error as Error).message }),
  });

  if (!embedded && !mounted) return null;

  if (!embedded && profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!profile || !isAdmin) return null;

  const categoryList = categoriesData?.data ?? [];

  const content = (
    <>
      {!embedded && (
        <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">ADMINISTRACIÓN</p>
            <h1 className="font-light mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
              Categorías
            </h1>
            <p className="text-muted-foreground text-[14px]">
              {categoryList.length} categoría{categoryList.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => handleCreateOpenChange(true)} className="flex items-center gap-1.5">
            <Plus size={14} /> Nueva categoría
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-[14px]">Cargando categorías…</p>
      ) : categoryList.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={32} />}
          title="Sin categorías"
          subtitle="Crea la primera categoría para organizar los anuncios."
          action={{ label: 'Crear categoría', onClick: () => handleCreateOpenChange(true) }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {categoryList.map((category) => (
            <CategoryRow key={category.id} category={category} token={token!} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) handleCreateOpenChange(false); }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Nueva categoría</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Nombre</Label>
              <Input
                type="text"
                placeholder="ej: Electrónica, Ropa, Hogar…"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                }}
                className="text-[13px] h-9"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Slug (URL)</Label>
              <Input type="text" value={newSlug} disabled className="text-[13px] h-9 font-mono opacity-60" />
              <p className="text-[10px] text-muted-foreground">Se genera automáticamente</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => handleCreateOpenChange(false)}>Cancelar</Button>
            <Button
              size="sm"
              disabled={createCategory.isPending || !newName.trim() || !newSlug.trim()}
              onClick={() => createCategory.mutate({ name: newName.trim(), slug: newSlug.trim() })}
            >
              {createCategory.isPending ? 'Creando…' : 'Crear categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return embedded ? content : (
    <div className="container-wide py-12 pb-20 flex-1 px-6">{content}</div>
  );
}
