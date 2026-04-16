'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '../../../../i18n/navigation';
import {
  useCreateListing, usePublicCategories, useUploadPhotos, useCategoryVariants,
} from '../../../lib/hooks';
import { useToken } from '../../../lib/hooks/token';
import type { VariantResponse } from '../../../lib/types/categories';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: 6,
};
const fieldGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };

// ─── Step 1: Listing form ─────────────────────────────────────────────────────

interface FormState {
  categoryId: string; title: string; description: string;
  price: string; location: string; sector: string;
  status: 'active' | 'draft';
}

function formatPriceInput(raw: string): string {
  const clean = raw.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
}

// ─── Dynamic variant field renderer ──────────────────────────────────────────

function VariantField({
  variant,
  value,
  onChange,
}: {
  variant: VariantResponse;
  value: string | number | boolean | undefined;
  onChange: (key: string, val: string | number | boolean) => void;
}) {
  const { key, name, valueType, options } = variant;

  if (valueType === 'boolean') {
    const checked = value === true || value === 'true';
    return (
      <div style={fieldGroup}>
        <label style={labelStyle}>{name}</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{ label: 'Sí', val: true }, { label: 'No', val: false }].map(({ label, val }) => (
            <label
              key={String(val)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                padding: '10px 16px', borderRadius: 8,
                border: `1px solid ${checked === val ? 'var(--accent-dim)' : 'var(--border-light)'}`,
                background: checked === val ? 'var(--bg-elevated)' : 'transparent',
                transition: 'all 0.15s', fontSize: 13,
              }}
            >
              <input
                type="radio"
                name={`variant-${key}`}
                checked={checked === val}
                onChange={() => onChange(key, val)}
                style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (valueType === 'select' && options && options.length > 0) {
    return (
      <div style={fieldGroup}>
        <label style={labelStyle}>{name}</label>
        <select
          value={String(value ?? '')}
          onChange={(e) => onChange(key, e.target.value)}
          className="field"
          style={{ appearance: 'none', cursor: 'pointer' }}
        >
          <option value="">— Selecciona —</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  if (valueType === 'number') {
    return (
      <div style={fieldGroup}>
        <label style={labelStyle}>{name}</label>
        <input
          type="number"
          value={String(value ?? '')}
          onChange={(e) => onChange(key, e.target.value === '' ? '' : Number(e.target.value))}
          className="field"
          placeholder="0"
        />
      </div>
    );
  }

  // default: text
  return (
    <div style={fieldGroup}>
      <label style={labelStyle}>{name}</label>
      <input
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(key, e.target.value)}
        className="field"
        placeholder={name}
        maxLength={255}
      />
    </div>
  );
}

// ─── Step 1: Details form ─────────────────────────────────────────────────────

function ListingDetailsStep({ onCreated }: { onCreated: (id: string) => void }) {
  const t = useTranslations('newListing');
  const token = useToken();
  const createListing = useCreateListing();
  const { data: catsData, isLoading: catsLoading } = usePublicCategories();
  const cats = catsData?.data ?? [];

  const [form, setForm] = useState<FormState>({
    categoryId: '', title: '', description: '',
    price: '', location: '', sector: '', status: 'active',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [variantValues, setVariantValues] = useState<Record<string, string | number | boolean>>({});

  // Fetch variants whenever category changes
  const { data: variantsData, isLoading: variantsLoading } = useCategoryVariants(
    form.categoryId || null,
    token,
  );
  const variants: VariantResponse[] = variantsData ?? [];

  // Reset variant values when category changes
  useEffect(() => {
    setVariantValues({});
  }, [form.categoryId]);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const setVariant = (key: string, val: string | number | boolean) => {
    setVariantValues((prev) => ({ ...prev, [key]: val }));
  };

  const parsedPrice = () => parseFloat(form.price.replace(/,/g, ''));

  const validate = (): Partial<FormState> => {
    const e: Partial<FormState> = {};
    if (!form.categoryId) e.categoryId = t('errorCategory');
    if (!form.title.trim()) e.title = t('errorTitle');
    if (form.description.trim().length < 10) e.description = t('errorDescription');
    const p = parsedPrice();
    if (isNaN(p) || p < 0) e.price = t('errorPrice');
    if (!form.location.trim()) e.location = t('errorTitle');
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    // Build variant payload — omit empty values
    const variantPayload: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(variantValues)) {
      if (v !== '' && v !== undefined && v !== null) variantPayload[k] = v;
    }

    const payload: Record<string, unknown> = {
      categoryId: form.categoryId,
      title: form.title.trim(),
      description: form.description.trim(),
      price: parsedPrice(),
      location: form.location.trim(),
      status: form.status,
    };
    if (form.sector.trim()) payload.sector = form.sector.trim();
    if (Object.keys(variantPayload).length > 0) payload.variants = variantPayload;

    createListing.mutate(payload, { onSuccess: (l) => onCreated(l.id) });
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
            <label style={labelStyle}>{t('categoryLabel')}</label>
            <select value={form.categoryId} onChange={set('categoryId')} className="field" disabled={catsLoading} style={{ appearance: 'none', cursor: 'pointer' }}>
              <option value="">{catsLoading ? 'Cargando…' : t('categoryPlaceholder')}</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.categoryId}</p>}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>{t('titleLabel')}</label>
            <input type="text" value={form.title} onChange={set('title')} className="field" placeholder={t('titlePlaceholder')} maxLength={255} />
            {errors.title && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.title}</p>}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{form.title.length}/255</p>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>{t('descriptionLabel')}</label>
            <textarea value={form.description} onChange={set('description')} className="field" placeholder={t('descriptionPlaceholder')} minLength={10} maxLength={5000} rows={6} style={{ resize: 'vertical', lineHeight: 1.6 }} />
            {errors.description && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{errors.description}</p>}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{form.description.length}/5000</p>
          </div>
        </div>

        {/* ── Dynamic category variants ── */}
        {form.categoryId && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: -8 }}>
              Características
            </p>

            {variantsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4 }} />
                    <div className="skeleton" style={{ height: 42, borderRadius: 8 }} />
                  </div>
                ))}
              </div>
            ) : variants.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Esta categoría no tiene características configuradas.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                {variants.map((v) => (
                  <VariantField
                    key={v.id}
                    variant={v}
                    value={variantValues[v.key]}
                    onChange={setVariant}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Price & location ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: -8 }}>
            Precio y ubicación
          </p>

          <div style={fieldGroup}>
            <label style={labelStyle}>{t('priceLabel')}</label>
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
              <label style={labelStyle}>{t('locationLabel')}</label>
              <input type="text" value={form.location} onChange={set('location')} className="field" placeholder={t('locationPlaceholder')} maxLength={120} />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>{t('sectorLabel')}</label>
              <input type="text" value={form.sector} onChange={set('sector')} className="field" placeholder={t('sectorPlaceholder')} maxLength={80} />
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
            <label style={labelStyle}>{t('statusLabel')}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['active', 'draft'] as const).map((s) => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 16px', borderRadius: 8, border: `1px solid ${form.status === s ? 'var(--accent-dim)' : 'var(--border-light)'}`, background: form.status === s ? 'var(--bg-elevated)' : 'transparent', transition: 'all 0.15s' }}>
                  <input type="radio" name="status" value={s} checked={form.status === s} onChange={set('status')} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                    {s === 'active' ? t('statusActive') : t('statusDraft')}
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
            {createListing.isPending ? t('submittingBtn') : t('submitBtn')}
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
  const t = useTranslations('newListing');
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
