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

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: 6,
};

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) { return; }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onClose(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); };
  }, [open, onClose]);

  if (!open) { return null; }

  return (
    <div
      onClick={(event) => { if (event.target === event.currentTarget) { onClose(); } }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        overflowY: 'auto',
      }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '28px 32px',
        width: '100%',
        maxWidth: 540,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        margin: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400 }}>{title}</p>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Nombre</label>
          <input
            className="field"
            value={form.name}
            onChange={(event) => {
              setField('name', event.target.value);
              if (!initialData) {
                setField('key', autoGenerateKey(event.target.value));
              }
            }}
            placeholder="ej: Marca, Habitaciones"
            style={{ fontSize: 13 }}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Clave (key)</label>
          <input
            className="field"
            value={form.key}
            onChange={(event) => setField('key', event.target.value)}
            placeholder="marca, habitaciones"
            style={{ fontSize: 13, fontFamily: 'monospace' }}
            required
          />
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Identificador único, sin espacios</p>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Tipo de valor</label>
        <select
          className="field"
          value={form.valueType}
          onChange={(event) => setField('valueType', event.target.value as AttributeValueType)}
          style={{ fontSize: 13, appearance: 'none', cursor: 'pointer' }}
        >
          {(Object.entries(ATTRIBUTE_TYPE_LABELS) as [AttributeValueType, string][]).map(([type, label]) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          id="isRequired"
          checked={form.isRequired}
          onChange={(event) => setField('isRequired', event.target.checked)}
          style={{ accentColor: 'var(--accent)', width: 16, height: 16, cursor: 'pointer' }}
        />
        <label htmlFor="isRequired" style={{ fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
          Campo requerido
        </label>
      </div>

      {form.valueType === 'select' && (
        <div>
          <label style={labelStyle}>Opciones disponibles</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              className="field"
              value={form.optionsInput}
              onChange={(event) => setField('optionsInput', event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addOption(); } }}
              placeholder="Escribe una opción y presiona Enter"
              style={{ fontSize: 13, flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={addOption}
              style={{ fontSize: 12, padding: '0 14px', flexShrink: 0 }}
            >
              <Plus size={13} />
            </button>
          </div>
          {form.options.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.options.map((option, index) => (
                <span key={index} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, padding: '4px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 999, color: 'var(--text-secondary)',
                }}>
                  {option}
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {form.options.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin opciones aún</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <button type="button" className="btn btn-ghost" style={{ fontSize: 13 }} onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ fontSize: 13 }}
          disabled={isPending || !form.name.trim() || !form.key.trim()}
        >
          {isPending ? 'Guardando…' : initialData ? 'Guardar cambios' : 'Crear atributo'}
        </button>
      </div>
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
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: 'var(--bg-elevated)',
        borderRadius: 8,
        border: '1px solid var(--border-light)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {attribute.name}
            </span>
            {attribute.isRequired && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '1px 6px',
                background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                color: 'var(--accent)', borderRadius: 999,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                requerido
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <code style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '1px 6px', borderRadius: 4 }}>
              {attribute.key}
            </code>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: ATTRIBUTE_TYPE_COLORS[attribute.valueType],
            }}>
              {ATTRIBUTE_TYPE_LABELS[attribute.valueType]}
            </span>
            {attribute.valueType === 'select' && attribute.options.length > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {attribute.options.length} opciones
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => setEditOpen(true)}
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={() => {
              sileo.action({
                title: `¿Eliminar "${attribute.name}"?`,
                description: 'Se eliminarán también los valores existentes en anuncios.',
                button: { title: 'Eliminar', onClick: () => deleteAttribute.mutate() },
              });
            }}
            disabled={deleteAttribute.isPending}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#CC6E6E', padding: '4px 8px',
              display: 'flex', alignItems: 'center', borderRadius: 6,
              opacity: deleteAttribute.isPending ? 0.5 : 1,
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Editar: ${attribute.name}`}>
        <AttributeForm
          initialData={attribute}
          onSubmit={(data) => updateAttribute.mutate(data)}
          onCancel={() => setEditOpen(false)}
          isPending={updateAttribute.isPending}
        />
      </Modal>
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
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Category header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', flexWrap: 'wrap' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'color-mix(in srgb, var(--accent) 10%, var(--bg-elevated))',
            border: '1px solid var(--border-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', flexShrink: 0,
          }}>
            <LayoutGrid size={14} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{category.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{category.slug}</span>
              {attributeCount > 0 && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  · {attributeCount} atributo{attributeCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => setAttributesExpanded(!attributesExpanded)}
            >
              <Settings size={11} />
              Atributos
              {attributesExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => setEditOpen(true)}
            >
              <Edit2 size={12} /> Editar
            </button>
            <button
              onClick={() => {
                sileo.action({
                  title: '¿Eliminar categoría?',
                  description: `Se eliminará "${category.name}" de forma permanente junto con sus atributos.`,
                  button: { title: 'Eliminar', onClick: () => deleteCategory.mutate() },
                });
              }}
              disabled={deleteCategory.isPending}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '5px 8px', display: 'flex', alignItems: 'center', borderRadius: 6 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Attributes panel */}
        {attributesExpanded && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'var(--bg-canvas)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Atributos dinámicos
              </p>
              <button
                className="btn btn-outline"
                style={{ fontSize: 11, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={() => setCreateAttributeOpen(true)}
              >
                <Plus size={11} /> Nuevo atributo
              </button>
            </div>

            {attributesLoading ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cargando…</p>
            ) : attributeList.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Sin atributos. Agrega uno para que los usuarios llenen info al publicar.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {attributeList.map((attribute) => (
                  <AttributeRow key={attribute.id} attribute={attribute} categoryId={category.id} token={token} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit category modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar categoría">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input
              className="field"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSlug(event.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
              }}
              style={{ fontSize: 13 }}
              placeholder="Nombre de la categoría"
            />
          </div>
          <div>
            <label style={labelStyle}>Slug (URL)</label>
            <input
              className="field"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              style={{ fontSize: 13, fontFamily: 'monospace' }}
              placeholder="slug-url"
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setEditOpen(false)}>Cancelar</button>
            <button
              className="btn btn-primary"
              style={{ fontSize: 13 }}
              disabled={updateCategory.isPending || !name.trim() || !slug.trim()}
              onClick={() => updateCategory.mutate({ name, slug })}
            >
              {updateCategory.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create attribute modal */}
      <Modal
        open={createAttributeOpen}
        onClose={() => setCreateAttributeOpen(false)}
        title="Nuevo atributo"
      >
        <AttributeForm
          onSubmit={(data) => createAttribute.mutate(data)}
          onCancel={() => setCreateAttributeOpen(false)}
          isPending={createAttribute.isPending}
        />
      </Modal>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando…</p>
      </div>
    );
  }

  if (!profile || !isAdmin) { return null; }

  const categoryList = categoriesData?.data ?? [];

  const content = (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: embedded ? 24 : 40 }}>
        <div>
          {!embedded && (
            <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
              ADMINISTRACIÓN
            </p>
          )}
          {!embedded && (
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 300, marginBottom: 8 }}>
              Categorías
            </h1>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {categoryList.length} categoría{categoryList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ fontSize: 13, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 7 }}
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={14} /> Nueva categoría
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando categorías…</p>
      ) : categoryList.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={32} />}
          title="Sin categorías"
          subtitle="Crea la primera categoría para organizar los anuncios."
          action={{ label: 'Crear categoría', href: '#' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {categoryList.map((category) => (
            <CategoryRow key={category.id} category={category} token={token!} />
          ))}
        </div>
      )}

      {/* Create category modal */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setNewName(''); setNewSlug(''); }}
        title="Nueva categoría"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input
              type="text"
              className="field"
              placeholder="ej: Electrónica, Ropa, Hogar…"
              value={newName}
              onChange={(event) => {
                setNewName(event.target.value);
                setNewSlug(event.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
              }}
              style={{ fontSize: 13 }}
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>Slug (URL)</label>
            <input
              type="text"
              className="field"
              placeholder="electronica"
              value={newSlug}
              onChange={(event) => setNewSlug(event.target.value)}
              style={{ fontSize: 13, fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Se usará en la URL: /listings?categoryId=…
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 13 }}
              onClick={() => { setCreateOpen(false); setNewName(''); setNewSlug(''); }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{ fontSize: 13 }}
              disabled={createCategory.isPending || !newName.trim() || !newSlug.trim()}
              onClick={() => createCategory.mutate({ name: newName.trim(), slug: newSlug.trim() })}
            >
              {createCategory.isPending ? 'Creando…' : 'Crear categoría'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );

  return embedded ? content : (
    <div className="container-wide" style={{ padding: '48px 24px 80px', flex: 1 }}>
      {content}
    </div>
  );
}
