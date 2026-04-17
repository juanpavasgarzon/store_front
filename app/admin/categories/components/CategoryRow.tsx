'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categories } from '../../../lib/api';
import { sileo } from 'sileo';
import type { CategoryResponse } from '../../../lib/types/categories';
import { AttributeRow } from './AttributeRow';
import { AttributeForm } from './AttributeForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { LayoutGrid, Edit2, Trash2, Settings, ChevronDown, ChevronRight, Plus } from 'lucide-react';

const labelClass = 'text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground';

export function CategoryRow({ category, token }: { category: CategoryResponse; token: string }) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [attributesExpanded, setAttributesExpanded] = useState(false);
  const [createAttributeOpen, setCreateAttributeOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);

  const { data: attributeList = [], isLoading: attributesLoading } = useQuery({
    queryKey: ['categoryAttributes', category.id],
    queryFn: () => categories.listAttributes(category.id),
    enabled: attributesExpanded,
    staleTime: 5 * 60 * 1000,
  });

  const updateCategory = useMutation({
    mutationFn: (data: object) => categories.update(token, category.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditOpen(false);
      sileo.success({ title: 'Categoría actualizada', description: `"${name}" guardada correctamente` });
    },
    onError: (error) => sileo.error({ title: 'Error', description: (error as Error).message }),
  });

  const deleteCategory = useMutation({
    mutationFn: () => categories.delete(token, category.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      sileo.info({ title: 'Categoría eliminada' });
    },
    onError: (error) => sileo.error({ title: 'Error', description: (error as Error).message }),
  });

  const createAttribute = useMutation({
    mutationFn: (data: object) => categories.createAttribute(token, category.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoryAttributes', category.id] });
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      setCreateAttributeOpen(false);
      sileo.success({ title: 'Atributo creado' });
    },
    onError: (error) => sileo.error({ title: 'Error', description: (error as Error).message }),
  });

  useEffect(() => {
    if (editOpen) { setName(category.name); setSlug(category.slug); }
  }, [editOpen, category.name, category.slug]);

  const attributeCount = attributesExpanded ? attributeList.length : (category.attributes?.length ?? 0);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5 flex-wrap">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-primary border"
            style={{
              background: 'color-mix(in srgb, var(--accent) 10%, var(--bg-elevated))',
              borderColor: 'var(--border-accent)',
            }}
          >
            <LayoutGrid size={14} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-foreground">{category.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-mono">{category.slug}</span>
              {attributeCount > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  · {attributeCount} atributo{attributeCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-1 items-center shrink-0 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAttributesExpanded(!attributesExpanded)}
              className="flex items-center gap-1.5 text-[12px]"
            >
              <Settings size={11} />
              <span className="hidden xs:inline">Atributos</span>
              {attributesExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 text-[12px]"
            >
              <Edit2 size={12} />
              <span className="hidden xs:inline">Editar</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                sileo.action({
                  title: '¿Eliminar categoría?',
                  description: `Se eliminará "${category.name}" de forma permanente junto con sus atributos.`,
                  button: { title: 'Eliminar', onClick: () => deleteCategory.mutate() },
                });
              }}
              disabled={deleteCategory.isPending}
              className="text-[#CC6E6E] hover:text-[#CC6E6E] hover:bg-[color-mix(in_srgb,#CC6E6E_10%,transparent)]"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {attributesExpanded && (
          <>
            <Separator />
            <div className="px-5 py-4 bg-background">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                  Atributos dinámicos
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateAttributeOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <Plus size={11} /> Nuevo atributo
                </Button>
              </div>

              {attributesLoading ? (
                <p className="text-[12px] text-muted-foreground">Cargando…</p>
              ) : attributeList.length === 0 ? (
                <div className="py-5 text-center text-muted-foreground text-[13px]">
                  Sin atributos. Agrega uno para que los usuarios llenen info al publicar.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {attributeList.map((attribute) => (
                    <AttributeRow key={attribute.id} attribute={attribute} categoryId={category.id} token={token} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Editar categoría</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                }}
                className="text-[13px] h-9"
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Slug (URL)</Label>
              <Input
                value={slug}
                disabled
                className="text-[13px] h-9 font-mono opacity-60"
                placeholder="slug-url"
              />
              <p className="text-[10px] text-muted-foreground">Se genera automáticamente</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              size="sm"
              disabled={updateCategory.isPending || !name.trim() || !slug.trim()}
              onClick={() => updateCategory.mutate({ name, slug })}
            >
              {updateCategory.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create attribute dialog */}
      <Dialog open={createAttributeOpen} onOpenChange={(open) => !open && setCreateAttributeOpen(false)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Nuevo atributo</DialogTitle>
          </DialogHeader>
          <AttributeForm
            onSubmit={(data) => createAttribute.mutate(data)}
            onCancel={() => setCreateAttributeOpen(false)}
            isPending={createAttribute.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
