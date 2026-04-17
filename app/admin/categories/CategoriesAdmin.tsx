'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '../../lib/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categories } from '../../lib/api';
import { useToken } from '../../lib/hooks/token';
import { sileo } from 'sileo';
import type { CategoryResponse, CategoryAttributeResponse, AttributeValueType } from '../../lib/types/categories';
import { X, Plus, Edit2, Trash2, LayoutGrid, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ATTRIBUTE_TYPE_LABELS: Record<AttributeValueType, string> = {
  text: 'Texto',
  number: 'Número',
  boolean: 'Sí / No',
  select: 'Opciones',
};

const ATTRIBUTE_TYPE_COLORS: Record<AttributeValueType, string> = {
  text: 'var(--text-muted)',
  number: '#9A8C7C',
  boolean: '#6ECC96',
  select: '#C87D38',
};

// ── Attribute Form ────────────────────────────────────────────────────────────

interface AttributeFormState {
  name: string;
  key: string;
  valueType: AttributeValueType;
  isRequired: boolean;
  optionsInput: string;
  options: string[];
}

function buildInitialAttributeForm(attribute?: CategoryAttributeResponse): AttributeFormState {
  return {
    name: attribute?.name ?? '',
    key: attribute?.key ?? '',
    valueType: attribute?.valueType ?? 'text',
    isRequired: attribute?.isRequired ?? false,
    optionsInput: '',
    options: attribute?.options ?? [],
  };
}

function AttributeForm({
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
  const [form, setForm] = useState<AttributeFormState>(() => buildInitialAttributeForm(initialData));

  const setField = <Key extends keyof AttributeFormState>(field: Key, value: AttributeFormState[Key]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const autoGenerateKey = (name: string): string =>
    name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const addOption = () => {
    const trimmed = form.optionsInput.trim();
    if (!trimmed || form.options.includes(trimmed)) { return; }
    setField('options', [...form.options, trimmed]);
    setField('optionsInput', '');
  };

  const removeOption = (index: number) => {
    setField('options', form.options.filter((_, i) => i !== index));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      name: form.name.trim(),
      key: form.key.trim(),
      valueType: form.valueType,
      isRequired: form.isRequired,
      options: form.valueType === 'select' ? form.options : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
            Nombre
          </Label>
          <Input
            value={form.name}
            onChange={(event) => {
              setField('name', event.target.value);
              if (!initialData) {
                setField('key', autoGenerateKey(event.target.value));
              }
            }}
            placeholder="ej: Marca, Habitaciones"
            className="text-[13px] h-9"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
            Clave (key)
          </Label>
          <Input
            value={form.key}
            onChange={(event) => setField('key', event.target.value)}
            placeholder="marca, habitaciones"
            className="text-[13px] h-9 font-mono tracking-[0.05em]"
            required
          />
          <p className="text-[10px] text-muted-foreground">Identificador único, sin espacios</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
          Tipo de valor
        </Label>
        <Select
          value={form.valueType}
          onValueChange={(v) => setField('valueType', v as AttributeValueType)}
        >
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
          onChange={(event) => setField('isRequired', event.target.checked)}
          className="w-4 h-4 cursor-pointer accent-[var(--accent)]"
        />
        <label htmlFor="isRequired" className="text-[13px] cursor-pointer text-muted-foreground">
          Campo requerido
        </label>
      </div>

      {form.valueType === 'select' && (
        <div className="flex flex-col gap-2">
          <Label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
            Opciones disponibles
          </Label>
          <div className="flex gap-2">
            <Input
              value={form.optionsInput}
              onChange={(event) => setField('optionsInput', event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addOption(); } }}
              placeholder="Escribe una opción y presiona Enter"
              className="text-[13px] h-9 flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={addOption} className="shrink-0">
              <Plus size={13} />
            </Button>
          </div>
          {form.options.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {form.options.map((option, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-[12px] px-2.5 py-1 bg-[var(--bg-elevated)] border-[var(--border-light)] text-muted-foreground flex items-center gap-1.5"
                >
                  {option}
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
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
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !form.name.trim() || !form.key.trim()}
        >
          {isPending ? 'Guardando…' : initialData ? 'Guardar cambios' : 'Crear atributo'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Attribute Row ─────────────────────────────────────────────────────────────

function AttributeRow({
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
              <Badge
                variant="outline"
                className="text-[10px] font-bold px-1.5 py-0 bg-primary/15 text-primary border-primary/20 tracking-[0.06em] uppercase"
              >
                requerido
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <code className="text-[10px] text-muted-foreground bg-card px-1.5 py-0.5 rounded">
              {attribute.key}
            </code>
            <span
              className="text-[10px] font-semibold tracking-[0.06em] uppercase"
              style={{ color: ATTRIBUTE_TYPE_COLORS[attribute.valueType] }}
            >
              {ATTRIBUTE_TYPE_LABELS[attribute.valueType]}
            </span>
            {attribute.valueType === 'select' && attribute.options.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {attribute.options.length} opciones
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditOpen(true)}
          >
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

      <Dialog open={editOpen} onOpenChange={(isOpen) => !isOpen && setEditOpen(false)}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>
              Editar: {attribute.name}
            </DialogTitle>
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

// ── Category Row ──────────────────────────────────────────────────────────────

function CategoryRow({ category, token }: { category: CategoryResponse; token: string }) {
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
    if (editOpen) {
      setName(category.name);
      setSlug(category.slug);
    }
  }, [editOpen, category.name, category.slug]);

  const attributeCount = attributesExpanded ? attributeList.length : (category.attributes?.length ?? 0);

  return (
    <>
      <Card className="overflow-hidden">
        {/* Category header row */}
        <div className="flex items-center gap-3 px-5 py-4 flex-wrap">
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

          <div className="flex gap-1.5 items-center shrink-0">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setAttributesExpanded(!attributesExpanded)}
              className="flex items-center gap-1.5"
            >
              <Settings size={11} />
              Atributos
              {attributesExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Edit2 size={12} /> Editar
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

        {/* Attributes panel */}
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
                  size="xs"
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

      {/* Edit category dialog */}
      <Dialog open={editOpen} onOpenChange={(isOpen) => !isOpen && setEditOpen(false)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Editar categoría</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Nombre
              </Label>
              <Input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setSlug(event.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                }}
                className="text-[13px] h-9"
                placeholder="Nombre de la categoría"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Slug (URL)
              </Label>
              <Input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="text-[13px] h-9 font-mono"
                placeholder="slug-url"
              />
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
      <Dialog open={createAttributeOpen} onOpenChange={(isOpen) => !isOpen && setCreateAttributeOpen(false)}>
        <DialogContent className="sm:max-w-[540px]">
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

// ── Main admin component ──────────────────────────────────────────────────────

export default function CategoriesAdmin({ embedded }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const token = useToken();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

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
      setNewName('');
      setNewSlug('');
      setCreateOpen(false);
      sileo.success({ title: 'Categoría creada', description: `"${newName}" lista para usar` });
    },
    onError: (error) => sileo.error({ title: 'Error al crear', description: (error as Error).message }),
  });

  if (!embedded && !mounted) { return null; }

  if (!embedded && profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!profile || !isAdmin) { return null; }

  const categoryList = categoriesData?.data ?? [];

  const content = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
        <div>
          {!embedded && (
            <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
              ADMINISTRACIÓN
            </p>
          )}
          {!embedded && (
            <h1 className="font-light mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
              Categorías
            </h1>
          )}
          <p className="text-muted-foreground text-[14px]">
            {categoryList.length} categoría{categoryList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5">
          <Plus size={14} /> Nueva categoría
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-muted-foreground text-[14px]">Cargando categorías…</p>
      ) : categoryList.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={32} />}
          title="Sin categorías"
          subtitle="Crea la primera categoría para organizar los anuncios."
          action={{ label: 'Crear categoría', href: '#' }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {categoryList.map((category) => (
            <CategoryRow key={category.id} category={category} token={token!} />
          ))}
        </div>
      )}

      {/* Create category dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) { setCreateOpen(false); setNewName(''); setNewSlug(''); }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)' }}>Nueva categoría</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Nombre
              </Label>
              <Input
                type="text"
                placeholder="ej: Electrónica, Ropa, Hogar…"
                value={newName}
                onChange={(event) => {
                  setNewName(event.target.value);
                  setNewSlug(event.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                }}
                className="text-[13px] h-9"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
                Slug (URL)
              </Label>
              <Input
                type="text"
                placeholder="electronica"
                value={newSlug}
                onChange={(event) => setNewSlug(event.target.value)}
                className="text-[13px] h-9 font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Se usará en la URL: /listings?categoryId=…
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setCreateOpen(false); setNewName(''); setNewSlug(''); }}
            >
              Cancelar
            </Button>
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
    <div className="container-wide py-12 pb-20 flex-1 px-6">
      {content}
    </div>
  );
}
