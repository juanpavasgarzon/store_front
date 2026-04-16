'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '../../../../i18n/navigation';
import { useProfile } from '../../../lib/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categories } from '../../../lib/api';
import { useToken } from '../../../lib/hooks/token';
import { sileo } from 'sileo';
import type { CategoryResponse, VariantResponse } from '../../../lib/types';
import { X, ChevronRight, Plus, Edit2, Trash2, LayoutGrid } from 'lucide-react';
import EmptyState from '../../../components/EmptyState';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: 6,
};

// ─── Modal backdrop ───────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '28px 32px',
        width: '100%',
        maxWidth: 520,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400 }}>{title}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Variant management panel ─────────────────────────────────────────────────
function VariantsPanel({ category, token }: { category: CategoryResponse; token: string }) {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVar, setEditingVar] = useState<VariantResponse | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'text' | 'number' | 'boolean' | 'select'>('text');
  const [newOptions, setNewOptions] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'text' | 'number' | 'boolean' | 'select'>('text');
  const [editOptions, setEditOptions] = useState('');

  const { data: vars, isLoading } = useQuery({
    queryKey: ['variants', category.id],
    queryFn: () => categories.getVariants(token, category.id),
    staleTime: 60_000,
  });

  const createVar = useMutation({
    mutationFn: (data: object) => categories.createVariant(token, category.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variants', category.id] });
      setNewName(''); setNewOptions(''); setNewType('text');
      setAddOpen(false);
      sileo.success({ title: 'Variante creada', description: `"${newName}" agregada correctamente` });
    },
    onError: (e) => sileo.error({ title: 'Error', description: (e as Error).message }),
  });

  const updateVar = useMutation({
    mutationFn: ({ varId, data }: { varId: string; data: object }) =>
      categories.updateVariant(token, category.id, varId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variants', category.id] });
      setEditOpen(false);
      setEditingVar(null);
      sileo.success({ title: 'Variante actualizada' });
    },
    onError: (e) => sileo.error({ title: 'Error', description: (e as Error).message }),
  });

  const deleteVar = useMutation({
    mutationFn: (varId: string) => categories.deleteVariant(token, category.id, varId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variants', category.id] });
      sileo.info({ title: 'Variante eliminada' });
    },
    onError: (e) => sileo.error({ title: 'Error', description: (e as Error).message }),
  });

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (newType === 'select' && !newOptions.trim()) {
      sileo.error({ title: 'Agrega al menos una opción para el campo de selección' }); return;
    }
    const key = newName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const data: Record<string, unknown> = { name: newName.trim(), key, valueType: newType };
    if (newType === 'select') {
      data.options = newOptions.split(',').map((o) => o.trim()).filter(Boolean);
    } else {
      data.options = [];
    }
    createVar.mutate(data);
  };

  const handleEdit = () => {
    if (!editingVar || !editName.trim()) return;
    if (editType === 'select' && !editOptions.trim()) {
      sileo.error({ title: 'Agrega al menos una opción para el campo de selección' }); return;
    }
    const data: Record<string, unknown> = { name: editName.trim(), valueType: editType };
    if (editType === 'select') {
      data.options = editOptions.split(',').map((o) => o.trim()).filter(Boolean);
    } else {
      data.options = [];
    }
    updateVar.mutate({ varId: editingVar.id, data });
  };

  const openEdit = (v: VariantResponse) => {
    setEditingVar(v);
    setEditName(v.name);
    setEditType(v.valueType as typeof editType);
    setEditOptions((v.options ?? []).join(', '));
    setEditOpen(true);
  };

  const TYPE_LABELS = { text: 'Texto', number: 'Número', boolean: 'Sí/No', select: 'Selección' };

  return (
    <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
          Variantes · {(vars ?? []).length}
        </p>
        <button
          className="btn btn-outline"
          style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={() => setAddOpen(true)}
        >
          <Plus size={11} /> Agregar
        </button>
      </div>

      {isLoading ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cargando…</p>
      ) : (vars ?? []).length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sin variantes. Agrega la primera.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(vars ?? []).map((v: VariantResponse) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, flex: 1, fontWeight: 500 }}>{v.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>{v.key}</span>
              <span style={{ fontSize: 11, color: 'var(--accent)', padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 4 }}>
                {TYPE_LABELS[v.valueType as keyof typeof TYPE_LABELS] ?? v.valueType}
              </span>
              {v.options && v.options.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.options.join(', ')}</span>
              )}
              <button
                onClick={() => openEdit(v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                title="Editar"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={() => {
                  sileo.action({
                    title: '¿Eliminar variante?',
                    description: `Se eliminará "${v.name}" de forma permanente.`,
                    button: { title: 'Eliminar', onClick: () => deleteVar.mutate(v.id) },
                  });
                }}
                disabled={deleteVar.isPending}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                title="Eliminar"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add variant modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nueva variante">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre de la variante</label>
            <input type="text" className="field" placeholder="ej: Color, Talla, Material…" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ fontSize: 13 }} />
          </div>
          <div>
            <label style={labelStyle}>Tipo de campo</label>
            <select className="field" value={newType} onChange={(e) => setNewType(e.target.value as typeof newType)} style={{ fontSize: 13 }}>
              <option value="text">Texto libre</option>
              <option value="number">Número</option>
              <option value="boolean">Sí / No</option>
              <option value="select">Selección (opciones fijas)</option>
            </select>
          </div>
          {newType === 'select' && (
            <div>
              <label style={labelStyle}>Opciones (separadas por coma)</label>
              <input type="text" className="field" placeholder="rojo, azul, verde, amarillo" value={newOptions} onChange={(e) => setNewOptions(e.target.value)} style={{ fontSize: 13 }} />
              {newOptions && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {newOptions.split(',').map((o) => o.trim()).filter(Boolean).map((o) => (
                    <span key={o} style={{ fontSize: 11, padding: '3px 10px', background: 'var(--bg-elevated)', borderRadius: 999, border: '1px solid var(--border-accent)', color: 'var(--accent)' }}>{o}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setAddOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" style={{ fontSize: 13 }} disabled={createVar.isPending || !newName.trim()} onClick={handleAdd}>
              {createVar.isPending ? 'Creando…' : '+ Crear variante'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit variant modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditingVar(null); }} title={`Editar: ${editingVar?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input type="text" className="field" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ fontSize: 13 }} />
          </div>
          <div>
            <label style={labelStyle}>Tipo de campo</label>
            <select className="field" value={editType} onChange={(e) => setEditType(e.target.value as typeof editType)} style={{ fontSize: 13 }}>
              <option value="text">Texto libre</option>
              <option value="number">Número</option>
              <option value="boolean">Sí / No</option>
              <option value="select">Selección (opciones fijas)</option>
            </select>
          </div>
          {editType === 'select' && (
            <div>
              <label style={labelStyle}>Opciones (separadas por coma)</label>
              <input type="text" className="field" value={editOptions} onChange={(e) => setEditOptions(e.target.value)} style={{ fontSize: 13 }} />
              {editOptions && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {editOptions.split(',').map((o) => o.trim()).filter(Boolean).map((o) => (
                    <span key={o} style={{ fontSize: 11, padding: '3px 10px', background: 'var(--bg-elevated)', borderRadius: 999, border: '1px solid var(--border-accent)', color: 'var(--accent)' }}>{o}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => { setEditOpen(false); setEditingVar(null); }}>Cancelar</button>
            <button className="btn btn-primary" style={{ fontSize: 13 }} disabled={updateVar.isPending || !editName.trim()} onClick={handleEdit}>
              {updateVar.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Single category row ──────────────────────────────────────────────────────
function CategoryRow({ cat, token }: { cat: CategoryResponse; token: string }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(cat.name);
  const [slug, setSlug] = useState(cat.slug);

  const update = useMutation({
    mutationFn: (data: object) => categories.update(token, cat.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminCategories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      setEditOpen(false);
      sileo.success({ title: 'Categoría actualizada', description: `"${name}" guardada correctamente` });
    },
    onError: (e) => sileo.error({ title: 'Error', description: (e as Error).message }),
  });

  const del = useMutation({
    mutationFn: () => categories.delete(token, cat.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminCategories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      sileo.info({ title: 'Categoría eliminada' });
    },
    onError: (e) => sileo.error({ title: 'Error', description: (e as Error).message }),
  });

  // Reset edit state when modal opens
  useEffect(() => {
    if (editOpen) {
      setName(cat.name);
      setSlug(cat.slug);
    }
  }, [editOpen, cat.name, cat.slug]);

  return (
    <>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', flexWrap: 'wrap' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in srgb, var(--accent) 10%, var(--bg-elevated))', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
            <LayoutGrid size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</p>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{cat.slug}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => setExpanded(!expanded)}
            >
              Variantes <ChevronRight size={12} style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
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
                  description: `Se eliminará "${cat.name}" y todas sus variantes de forma permanente.`,
                  button: { title: 'Eliminar', onClick: () => del.mutate() },
                });
              }}
              disabled={del.isPending}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', padding: '5px 8px', display: 'flex', alignItems: 'center', borderRadius: 6 }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {expanded && (
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
            <VariantsPanel category={cat} token={token} />
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
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
              }}
              style={{ fontSize: 13 }}
              placeholder="Nombre de la categoría"
            />
          </div>
          <div>
            <label style={labelStyle}>Slug (URL)</label>
            <input className="field" value={slug} onChange={(e) => setSlug(e.target.value)} style={{ fontSize: 13, fontFamily: 'monospace' }} placeholder="slug-url" />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setEditOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" style={{ fontSize: 13 }} disabled={update.isPending || !name.trim() || !slug.trim()} onClick={() => update.mutate({ name, slug })}>
              {update.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─── Main admin component ─────────────────────────────────────────────────────
export default function CategoriesAdmin({ embedded }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const token = useToken();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (!embedded && mounted && !profileLoading && (!profile || !isAdmin)) {
      router.push('/');
    }
  }, [embedded, mounted, profileLoading, profile, isAdmin, router]);

  const { data: catsData, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => categories.list(token!, undefined, 100),
    enabled: !!token && !!isAdmin,
  });

  const create = useMutation({
    mutationFn: (data: object) => categories.create(token!, data),
    onSuccess: () => {
      // Invalidate both admin list and public list so listing form picks up new category
      qc.invalidateQueries({ queryKey: ['adminCategories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      setNewName(''); setNewSlug('');
      setCreateOpen(false);
      sileo.success({ title: 'Categoría creada', description: `"${newName}" lista para usar` });
    },
    onError: (e) => sileo.error({ title: 'Error al crear', description: (e as Error).message }),
  });

  if (!embedded && !mounted) return null;

  if (!embedded && profileLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando…</p>
      </div>
    );
  }

  if (!profile || !isAdmin) return null;

  const cats = catsData?.data ?? [];

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
              Categorías y <em style={{ fontStyle: 'italic', color: 'var(--accent-light)' }}>variantes</em>
            </h1>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {cats.length} categoría{cats.length !== 1 ? 's' : ''}
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
      ) : cats.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={32} />}
          title="Sin categorías"
          subtitle="Crea la primera categoría para organizar los anuncios."
          action={{ label: 'Crear categoría', href: '#' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cats.map((cat) => (
            <CategoryRow key={cat.id} cat={cat} token={token!} />
          ))}
        </div>
      )}

      {/* Create category modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setNewName(''); setNewSlug(''); }} title="Nueva categoría">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input
              type="text"
              className="field"
              placeholder="ej: Electrónica, Ropa, Hogar…"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
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
              onChange={(e) => setNewSlug(e.target.value)}
              style={{ fontSize: 13, fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Se usará en la URL: /listings?categoryId=…
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => { setCreateOpen(false); setNewName(''); setNewSlug(''); }}>Cancelar</button>
            <button
              className="btn btn-primary"
              style={{ fontSize: 13 }}
              disabled={create.isPending || !newName.trim() || !newSlug.trim()}
              onClick={() => create.mutate({ name: newName.trim(), slug: newSlug.trim() })}
            >
              {create.isPending ? 'Creando…' : 'Crear categoría'}
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
