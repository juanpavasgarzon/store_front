'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categories } from '../../../lib/api';
import { sileo } from 'sileo';
import type { CategoryAttributeResponse, AttributeValueType } from '../../../lib/types/categories';
import { AttributeForm, ATTRIBUTE_TYPE_LABELS } from './AttributeForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Edit2, Trash2 } from 'lucide-react';

const ATTRIBUTE_TYPE_COLORS: Record<AttributeValueType, string> = {
  text: 'var(--text-muted)',
  number: '#9A8C7C',
  boolean: '#6ECC96',
  select: '#C87D38',
};

export function AttributeRow({
  attribute,
  categoryId,
  token,
}: {
  attribute: CategoryAttributeResponse;
  categoryId: string;
  token: string;
}) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const updateAttribute = useMutation({
    mutationFn: (data: object) => categories.updateAttribute(token, categoryId, attribute.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoryAttributes', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      setEditOpen(false);
      sileo.success({ title: 'Atributo actualizado' });
    },
    onError: (error) => sileo.error({ title: 'Error', description: (error as Error).message }),
  });

  const deleteAttribute = useMutation({
    mutationFn: () => categories.deleteAttribute(token, categoryId, attribute.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoryAttributes', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      sileo.info({ title: 'Atributo eliminado' });
    },
    onError: (error) => sileo.error({ title: 'Error', description: (error as Error).message }),
  });

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-light)]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-medium text-foreground">{attribute.name}</span>
            {attribute.isRequired && (
              <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 bg-primary/15 text-primary border-primary/20 tracking-[0.06em] uppercase">
                requerido
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <code className="text-[10px] text-muted-foreground bg-card px-1.5 py-0.5 rounded">{attribute.key}</code>
            <span
              className="text-[10px] font-semibold tracking-[0.06em] uppercase"
              style={{ color: ATTRIBUTE_TYPE_COLORS[attribute.valueType] }}
            >
              {ATTRIBUTE_TYPE_LABELS[attribute.valueType]}
            </span>
            {attribute.valueType === 'select' && attribute.options.length > 0 && (
              <span className="text-[11px] text-muted-foreground">{attribute.options.length} opciones</span>
            )}
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={() => setEditOpen(true)}>
            <Edit2 size={11} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              sileo.action({
                title: `¿Eliminar "${attribute.name}"?`,
                description: 'Se eliminarán también los valores existentes en anuncios.',
                button: { title: 'Eliminar', onClick: () => deleteAttribute.mutate() },
              });
            }}
            disabled={deleteAttribute.isPending}
            className="text-[#CC6E6E] hover:text-[#CC6E6E] hover:bg-[color-mix(in_srgb,#CC6E6E_10%,transparent)]"
          >
            <Trash2 size={11} />
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Editar: {attribute.name}</DialogTitle>
          </DialogHeader>
          <AttributeForm
            initialData={attribute}
            onSubmit={(data) => updateAttribute.mutate(data)}
            onCancel={() => setEditOpen(false)}
            isPending={updateAttribute.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
