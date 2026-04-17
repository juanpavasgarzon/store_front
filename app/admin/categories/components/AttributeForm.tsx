'use client';

import { useState } from 'react';
import type { CategoryAttributeResponse, AttributeValueType } from '../../../lib/types/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';

export const ATTRIBUTE_TYPE_LABELS: Record<AttributeValueType, string> = {
  text: 'Texto',
  number: 'Número',
  boolean: 'Sí / No',
  select: 'Opciones',
};

interface AttributeFormState {
  name: string;
  key: string;
  valueType: AttributeValueType;
  isRequired: boolean;
  optionsInput: string;
  options: string[];
}

function buildInitial(attribute?: CategoryAttributeResponse): AttributeFormState {
  return {
    name: attribute?.name ?? '',
    key: attribute?.key ?? '',
    valueType: attribute?.valueType ?? 'text',
    isRequired: attribute?.isRequired ?? false,
    optionsInput: '',
    options: attribute?.options ?? [],
  };
}

const autoKey = (name: string) =>
  name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

export function AttributeForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
}: {
  initialData?: CategoryAttributeResponse;
  onSubmit: (data: object) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<AttributeFormState>(() => buildInitial(initialData));

  const setField = <K extends keyof AttributeFormState>(field: K, value: AttributeFormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addOption = () => {
    const trimmed = form.optionsInput.trim();
    if (!trimmed || form.options.includes(trimmed)) return;
    setField('options', [...form.options, trimmed]);
    setField('optionsInput', '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: form.name.trim(),
      key: form.key.trim(),
      valueType: form.valueType,
      isRequired: form.isRequired,
      options: form.valueType === 'select' ? form.options : [],
    });
  };

  const labelClass = 'text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className={labelClass}>Nombre</Label>
          <Input
            value={form.name}
            onChange={(e) => {
              setField('name', e.target.value);
              if (!initialData) setField('key', autoKey(e.target.value));
            }}
            placeholder="ej: Marca, Habitaciones"
            className="text-[13px] h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className={labelClass}>Clave (key)</Label>
          <Input
            value={form.key}
            disabled
            placeholder="marca, habitaciones"
            className="text-[13px] h-9 font-mono tracking-[0.05em] opacity-60"
          />
          <p className="text-[10px] text-muted-foreground">Se genera automáticamente</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className={labelClass}>Tipo de valor</Label>
        <Select value={form.valueType} onValueChange={(v) => setField('valueType', v as AttributeValueType)}>
          <SelectTrigger className="text-[13px] h-9">
            <SelectValue placeholder="Tipo de atributo">
              {(v: string) => ATTRIBUTE_TYPE_LABELS[v as AttributeValueType] ?? v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(ATTRIBUTE_TYPE_LABELS) as [AttributeValueType, string][]).map(([type, label]) => (
              <SelectItem key={type} value={type} label={label} className="text-[13px]">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          id="isRequired"
          checked={form.isRequired}
          onChange={(e) => setField('isRequired', e.target.checked)}
          className="w-4 h-4 cursor-pointer accent-[var(--accent)]"
        />
        <label htmlFor="isRequired" className="text-[13px] cursor-pointer text-muted-foreground">
          Campo requerido
        </label>
      </div>

      {form.valueType === 'select' && (
        <div className="flex flex-col gap-2">
          <Label className={labelClass}>Opciones disponibles</Label>
          <div className="flex gap-2">
            <Input
              value={form.optionsInput}
              onChange={(e) => setField('optionsInput', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
              placeholder="Escribe una opción y presiona Enter"
              className="text-[13px] h-9 flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addOption} className="shrink-0">
              <Plus size={13} />
            </Button>
          </div>
          {form.options.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {form.options.map((option, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[12px] px-2.5 py-1 bg-[var(--bg-elevated)] border-[var(--border-light)] text-muted-foreground flex items-center gap-1.5"
                >
                  {option}
                  <button
                    type="button"
                    onClick={() => setField('options', form.options.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-foreground flex p-0 bg-transparent border-none cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground italic">Sin opciones aún</p>
          )}
        </div>
      )}

      <Separator className="mt-1" />

      <DialogFooter>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={isPending || !form.name.trim() || !form.key.trim()}>
          {isPending ? 'Guardando…' : initialData ? 'Guardar cambios' : 'Crear atributo'}
        </Button>
      </DialogFooter>
    </form>
  );
}
