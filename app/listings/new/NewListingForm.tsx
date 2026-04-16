'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCreateListing, usePublicCategories, useUploadPhotos, useCategoryAttributes,
} from '../../lib/hooks';
import type { CategoryAttributeResponse } from '../../lib/types/categories';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: 6,
};
const fieldGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };

// ─── Step 1: Listing form ─────────────────────────────────────────────────────

interface FormState {
  categoryId: string;
  title: string;
  description: string;
  price: string;
  location: string;
  sector: string;
  status: 'active' | 'draft';
}

type AttributeValues = Record<string, string>;

function formatPriceInput(raw: string): string {
  const clean = raw.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
}

// ─── Step 1: Details form ─────────────────────────────────────────────────────

function DynamicAttributeField({
  attribute,
  value,
  onChange,
}: {
  attribute: CategoryAttributeResponse;
  value: string;
  onChange: (value: string) => void;
}) {
  if (attribute.valueType === 'boolean') {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        {['true', 'false'].map((option) => (
          <label
            key={option}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              padding: '10px 16px', borderRadius: 8,
              border: `1px solid ${value === option ? 'var(--accent-dim)' : 'var(--border-light)'}`,
              background: value === option ? 'var(--bg-elevated)' : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            <input
              type="radio"
              name={attribute.key}
              value={option}
              checked={value === option}
              onChange={(event) => onChange(event.target.value)}
              style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              {option === 'true' ? 'Sí' : 'No'}
            </span>
          </label>
        ))}
      </div>
    );
  }

  if (attribute.valueType === 'select') {
    return (
      <select
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ fontSize: 13, appearance: 'none', cursor: 'pointer' }}
      >
        <option value="">Selecciona una opción</option>
        {attribute.options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (attribute.valueType === 'number') {
    return (
      <input
        type="number"
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        style={{ fontSize: 13 }}
      />
    );
  }

  return (
    <input
      type="text"
      className="field"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={attribute.name}
      style={{ fontSize: 13 }}
    />
  );
}

function ListingDetailsStep({ onCreated }: { onCreated: (id: string) => void }) {
  const createListing = useCreateListing();
  const { data: catsData, isLoading: catsLoading } = usePublicCategories();
  const cats = catsData?.data ?? [];

  const [form, setForm] = useState<FormState>({
    categoryId: '', title: '', description: '',
    price: '', location: '', sector: '', status: 'active',
  });
  const [attributeValues, setAttributeValues] = useState<AttributeValues>({});
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const { data: categoryAttributes = [], isLoading: attributesLoading } = useCategoryAttributes(
    form.categoryId || null,
  );

  const setField = (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((previous) => ({ ...previous, categoryId: event.target.value }));
    setAttributeValues({});
  };

  const setAttributeValue = (attributeId: string, value: string) => {
    setAttributeValues((previous) => ({ ...previous, [attributeId]: value }));
  };

  const parsedPrice = () => parseFloat(form.price.replace(/,/g, ''));

  const validate = (): Partial<FormState> => {
    const validationErrors: Partial<FormState> = {};
    if (!form.categoryId) { validationErrors.categoryId = 'Selecciona una categoría'; }
    if (!form.title.trim()) { validationErrors.title = 'El título es requerido'; }
    if (form.description.trim().length < 10) { validationErrors.description = 'La descripción debe tener al menos 10 caracteres'; }
    const price = parsedPrice();
    if (isNaN(price) || price < 0) { validationErrors.price = 'Ingresa un precio válido'; }
    if (!form.location.trim()) { validationErrors.location = 'La ubicación es requerida'; }
    return validationErrors;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const attributeValuesPayload = Object.entries(attributeValues)
      .filter(([, value]) => value !== '' && value !== undefined)
      .map(([attributeId, value]) => ({ attributeId, value }));

    const payload: Record<string, unknown> = {
      categoryId: form.categoryId,
      title: form.title.trim(),
      description: form.description.trim(),
      price: parsedPrice(),
      location: form.location.trim(),
      status: form.status,
      attributeValues: attributeValuesPayload,
    };
    if (form.sector.trim()) { payload.sector = form.sector.trim(); }

    createListing.mutate(payload, { onSuccess: (listing) => onCreated(listing.id) });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
        {/* ── Main details ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: -8 }}>
            Información principal
          </p>

          <div style={fieldGroup}>
            <label style={labelStyle}>{'Categoría'}</label>
            <select
              value={form.categoryId}
              onChange={handleCategoryChange}
              className="field"
              disabled={catsLoading}
              style={{ appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">{catsLoading ? 'Cargando…' : 'Selecciona una categoría'}</option>
              {cats.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            {errors.categoryId && (
              <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.categoryId}</p>
            )}
          </div>

          {/* Dynamic attributes */}
          {form.categoryId && (
            <div>
              {attributesLoading ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cargando atributos…</p>
              ) : categoryAttributes.length > 0 ? (
                <>
                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 0 24px' }} />
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20 }}>
                    Características específicas
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                    {categoryAttributes.map((attribute) => (
                      <div key={attribute.id} style={fieldGroup}>
                        <label style={labelStyle}>
                          {attribute.name}
                          {attribute.isRequired && (
                            <span style={{ color: 'var(--accent)', marginLeft: 4 }}>*</span>
                          )}
                        </label>
                        <DynamicAttributeField
                          attribute={attribute}
                          value={attributeValues[attribute.id] ?? ''}
                          onChange={(value) => setAttributeValue(attribute.id, value)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}

          <div style={fieldGroup}>
            <label style={labelStyle}>{'Título'}</label>
            <input type="text" value={form.title} onChange={setField('title')} className="field" placeholder={'Describe tu artículo en pocas palabras'} maxLength={255} />
            {errors.title && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.title}</p>}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{form.title.length}/255</p>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>{'Descripción'}</label>
            <textarea value={form.description} onChange={setField('description')} className="field" placeholder={'Descripción detallada de tu artículo (mín. 10 caracteres)'} minLength={10} maxLength={5000} rows={6} style={{ resize: 'vertical', lineHeight: 1.6 }} />
            {errors.description && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.description}</p>}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{form.description.length}/5000</p>
          </div>
        </div>

        {/* ── Price & location ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: -8 }}>
            Precio y ubicación
          </p>

          <div style={fieldGroup}>
            <label style={labelStyle}>{'Precio (USD)'}</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none' }}>$</span>
              <input
                type="text" inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: formatPriceInput(e.target.value) }))}
                className="field" placeholder="0.00"
                style={{ paddingLeft: 28 }}
              />
            </div>
            {errors.price && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.price}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldGroup}>
              <label style={labelStyle}>{'Ubicación'}</label>
              <input type="text" value={form.location} onChange={setField('location')} className="field" placeholder={'Ciudad o barrio'} maxLength={120} />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>{'Sector / zona'}</label>
              <input type="text" value={form.sector} onChange={setField('sector')} className="field" placeholder={'Barrio opcional'} maxLength={80} />
            </div>
          </div>
          {errors.location && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.location}</p>}
        </div>

        {/* ── Publish settings ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
            Publicación
          </p>

          <div style={fieldGroup}>
            <label style={labelStyle}>{'Estado'}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['active', 'draft'] as const).map((s) => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 16px', borderRadius: 8, border: `1px solid ${form.status === s ? 'var(--accent-dim)' : 'var(--border-light)'}`, background: form.status === s ? 'var(--bg-elevated)' : 'transparent', transition: 'all 0.15s' }}>
                  <input type="radio" name="status" value={s} checked={form.status === s} onChange={setField('status')} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                    {s === 'active' ? 'Activo (visible de inmediato)' : 'Borrador (guardar para después)'}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {createListing.error && (
            <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--color-error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--color-error)' }}>
              {(createListing.error as Error).message}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={createListing.isPending} style={{ padding: '14px', fontSize: 14 }}>
            {createListing.isPending ? 'Publicando…' : 'Publicar anuncio'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Step 2: Photo upload ─────────────────────────────────────────────────────

function PhotoUploadStep({ listingId }: { listingId: string }) {
  const router = useRouter();
  const upload = useUploadPhotos(listingId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const next = validFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPreviews((p) => [...p, ...next].slice(0, 10)); // max 10 photos
  }, []);

  const removePreview = (i: number) => {
    setPreviews((p) => {
      URL.revokeObjectURL(p[i].url);
      return p.filter((_, idx) => idx !== i);
    });
  };

  const handleUpload = () => {
    if (previews.length === 0) { router.push(`/listings/${listingId}`); return; }
    upload.mutate(previews.map((p) => p.file), {
      onSuccess: (res) => {
        setUploadedCount(res.length);
        setTimeout(() => router.push(`/listings/${listingId}`), 1200);
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Success banner */}
      <div style={{ padding: '16px 20px', background: 'color-mix(in srgb, var(--color-success) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-success) 25%, transparent)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20, color: 'var(--color-success)' }}>✓</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>¡Anuncio creado exitosamente!</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ahora puedes agregar fotos para hacerlo más atractivo.</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 14, padding: '48px 24px', textAlign: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          background: dragOver ? 'color-mix(in srgb, var(--accent) 4%, transparent)' : 'var(--bg-surface)',
        }}
      >
        <input
          ref={fileInputRef} type="file" accept="image/*" multiple
          style={{ display: 'none' }}
          onChange={(e) => addFiles(e.target.files)}
        />
        <p style={{ fontSize: 32, marginBottom: 12, color: 'var(--text-muted)' }}>◈</p>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
          Arrastra fotos aquí o haz clic para seleccionar
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          JPG, PNG, WEBP · máx. 10 fotos
        </p>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
            {previews.length} foto{previews.length !== 1 ? 's' : ''} seleccionada{previews.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
            {previews.map((p, i) => (
              <div key={p.url} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={(e) => { e.stopPropagation(); removePreview(i); }}
                  style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
                {i === 0 && (
                  <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--accent)', color: '#000', padding: '2px 6px', borderRadius: 4 }}>
                    Principal
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload feedback */}
      {upload.isSuccess && (
        <p style={{ fontSize: 13, color: 'var(--color-success)', textAlign: 'center' }}>
          ✓ {uploadedCount} foto{uploadedCount !== 1 ? 's' : ''} subida{uploadedCount !== 1 ? 's' : ''}. Redirigiendo…
        </p>
      )}
      {upload.error && (
        <p style={{ fontSize: 13, color: 'var(--color-error)' }}>{(upload.error as Error).message}</p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, padding: '14px', fontSize: 14 }}
          disabled={upload.isPending || upload.isSuccess}
          onClick={handleUpload}
        >
          {upload.isPending
            ? 'Subiendo fotos…'
            : previews.length === 0
            ? 'Continuar sin fotos →'
            : `Subir ${previews.length} foto${previews.length !== 1 ? 's' : ''} →`}
        </button>
      </div>
    </div>
  );
}

// ─── Main component with steps ────────────────────────────────────────────────

export default function NewListingForm() {
  const [createdId, setCreatedId] = useState<string | null>(null);

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
        {[
          { n: 1, label: 'Detalles del anuncio' },
          { n: 2, label: 'Fotos' },
        ].map((step, i) => {
          const done = createdId !== null && step.n === 1;
          const active = (step.n === 1 && !createdId) || (step.n === 2 && createdId);
          return (
            <div key={step.n} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: done ? 'var(--color-success)' : active ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: done || active ? '#000' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: done ? 16 : 13, fontWeight: 700, flexShrink: 0,
                  border: `2px solid ${done ? 'var(--color-success)' : active ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'all 0.3s',
                }}>
                  {done ? '✓' : step.n}
                </div>
                <span style={{ fontSize: 11, color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                  {step.label}
                </span>
              </div>
              {i < 1 && (
                <div style={{ width: 64, height: 2, background: done ? 'var(--color-success)' : 'var(--border)', margin: '0 8px', marginBottom: 22, transition: 'background 0.3s', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      {createdId ? (
        <PhotoUploadStep listingId={createdId} />
      ) : (
        <ListingDetailsStep onCreated={setCreatedId} />
      )}
    </div>
  );
}
