'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  useUpdateListing, useUploadPhotos, usePublicCategories, useCategoryAttributes, useProfile,
} from '../../../lib/hooks';
import type { ListingResponse } from '../../../lib/types';
import type { CategoryAttributeResponse } from '../../../lib/types/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ImagePlus } from 'lucide-react';

const LocationPicker = dynamic(() => import('../../../components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
  ),
});

// ─── Shared helpers ───────────────────────────────────────────────────────────

const labelClass = 'text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground';

type AttributeValues = Record<string, string>;

function formatPriceInput(raw: string): string {
  const clean = raw.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
}

function formatPriceDisplay(price: number): string {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Dynamic attribute field ──────────────────────────────────────────────────

function DynamicAttributeField({
  attribute, value, onChange,
}: {
  attribute: CategoryAttributeResponse;
  value: string;
  onChange: (value: string) => void;
}) {
  if (attribute.valueType === 'boolean') {
    return (
      <div className="flex gap-3">
        {['true', 'false'].map((option) => (
          <label
            key={option}
            className={cn(
              'flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-lg border transition-all duration-150',
              value === option
                ? 'border-[var(--accent-dim)] bg-[var(--bg-elevated)]'
                : 'border-[var(--border-light)] bg-transparent',
            )}
          >
            <input
              type="radio"
              name={attribute.key}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              className="w-[14px] h-[14px] accent-[var(--accent)]"
            />
            <span className="text-[13px] text-foreground">{option === 'true' ? 'Sí' : 'No'}</span>
          </label>
        ))}
      </div>
    );
  }

  if (attribute.valueType === 'select') {
    return (
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="text-[13px] h-10">
          <SelectValue placeholder="Selecciona una opción">
            {(v: string) => v || undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {attribute.options.map((option) => (
            <SelectItem key={option} value={option} className="text-[13px]">{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (attribute.valueType === 'number') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="text-[13px] h-10"
      />
    );
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={attribute.name}
      className="text-[13px] h-10"
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface EditListingFormProps {
  listing: ListingResponse;
}

export default function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateListing = useUpdateListing();
  const uploadPhotos = useUploadPhotos(listing.id);
  const { data: catsData, isLoading: catsLoading } = usePublicCategories();
  const cats = catsData?.data ?? [];

  // ── Form state ──────────────────────────────────────────────────────────────
  const [categoryId, setCategoryId] = useState(listing.categoryId);
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [price, setPrice] = useState(formatPriceDisplay(listing.price));
  const [locationName, setLocationName] = useState(listing.location);
  const [status, setStatus] = useState<'active' | 'draft' | 'reserved' | 'sold'>(
    listing.status as 'active' | 'draft' | 'reserved' | 'sold',
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    listing.latitude != null && listing.longitude != null
      ? { lat: listing.latitude, lng: listing.longitude }
      : null,
  );

  // Attribute values — pre-populate from listing
  const [attributeValues, setAttributeValues] = useState<AttributeValues>(() => {
    const init: AttributeValues = {};
    listing.attributeValues?.forEach((av) => { init[av.attributeId] = av.value; });
    return init;
  });

  const { data: categoryAttributes = [], isLoading: attributesLoading } = useCategoryAttributes(
    categoryId || null,
  );

  // ── Photo upload state ──────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<{ file: File; url: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!profileLoading && profile && profile.id !== listing.userId) {
      router.replace(`/listings/${listing.id}`);
    }
    if (!profileLoading && !profile) {
      router.replace(`/auth/login?redirect=/listings/${listing.id}/edit`);
    }
  }, [profileLoading, profile, listing.id, listing.userId, router]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const parsedPrice = () => parseFloat(price.replace(/,/g, ''));

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setAttributeValues({});
  };

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const next = valid.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setNewPhotoPreviews((p) => [...p, ...next].slice(0, 10));
  }, []);

  const removeNewPreview = (i: number) => {
    setNewPhotoPreviews((p) => {
      URL.revokeObjectURL(p[i].url);
      return p.filter((_, idx) => idx !== i);
    });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!categoryId) errs.categoryId = 'Selecciona una categoría';
    if (!title.trim()) errs.title = 'El título es requerido';
    if (description.trim().length < 10) errs.description = 'Mín. 10 caracteres';
    if (isNaN(parsedPrice()) || parsedPrice() < 0) errs.price = 'Precio inválido';
    if (!locationName.trim() && !coords) errs.location = 'Busca tu ubicación o coloca un pin en el mapa';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const attributeValuesPayload = Object.entries(attributeValues)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([attributeId, value]) => ({ attributeId, value }));

    const loc = locationName.trim() || (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : listing.location);
    const payload: Record<string, unknown> = {
      categoryId,
      title: title.trim(),
      description: description.trim(),
      price: parsedPrice(),
      location: loc,
      status,
      attributeValues: attributeValuesPayload,
    };
    if (coords) { payload.latitude = coords.lat; payload.longitude = coords.lng; }

    updateListing.mutate(
      { id: listing.id, data: payload },
      {
        onSuccess: () => {
          // Upload new photos if any, then redirect
          if (newPhotoPreviews.length > 0) {
            uploadPhotos.mutate(newPhotoPreviews.map((p) => p.file), {
              onSuccess: (res) => {
                setUploadedCount(res.length);
                setTimeout(() => router.push(`/listings/${listing.id}`), 800);
              },
              onError: () => router.push(`/listings/${listing.id}`),
            });
          } else {
            router.push(`/listings/${listing.id}`);
          }
        },
      },
    );
  };

  // ── Guard render ─────────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Cargando…</p>
      </div>
    );
  }

  if (!profile || profile.id !== listing.userId) return null;

  const isPending = updateListing.isPending || uploadPhotos.isPending;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Main info ── */}
      <Card>
        <CardContent className="pt-7 flex flex-col gap-6">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary -mb-2">
            Información principal
          </p>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Categoría</Label>
            <Select value={categoryId} onValueChange={(v) => v && handleCategoryChange(v)} disabled={catsLoading}>
              <SelectTrigger className="text-[13px] h-10">
                <SelectValue placeholder={catsLoading ? 'Cargando…' : 'Selecciona una categoría'}>
                  {(v: string) => cats.find((c) => c.id === v)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {cats.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} label={cat.name} className="text-[13px]">{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-[12px] text-destructive">{errors.categoryId}</p>}
          </div>

          {/* Dynamic attributes */}
          {categoryId && !attributesLoading && categoryAttributes.length > 0 && (
            <>
              <Separator />
              <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary -mb-2">
                Características específicas
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
                {categoryAttributes.map((attribute) => (
                  <div key={attribute.id} className="flex flex-col gap-1.5">
                    <Label className={labelClass}>
                      {attribute.name}
                      {attribute.isRequired && <span className="text-primary ml-1">*</span>}
                    </Label>
                    <DynamicAttributeField
                      attribute={attribute}
                      value={attributeValues[attribute.id] ?? ''}
                      onChange={(value) => setAttributeValues((p) => ({ ...p, [attribute.id]: value }))}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Título</Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe tu artículo en pocas palabras"
              maxLength={255}
              className="h-10 text-[13px]"
            />
            {errors.title && <p className="text-[12px] text-destructive">{errors.title}</p>}
            <p className="text-[11px] text-muted-foreground text-right">{title.length}/255</p>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Descripción</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción detallada (mín. 10 caracteres)"
              minLength={10}
              maxLength={5000}
              rows={6}
              className={cn(
                'w-full px-[14px] py-[11px] rounded-lg border border-input bg-transparent dark:bg-input/30 text-[13px]',
                'text-foreground resize-y leading-relaxed outline-none transition-colors',
                'focus:border-[var(--accent-dim)] placeholder:text-muted-foreground',
              )}
            />
            {errors.description && <p className="text-[12px] text-destructive">{errors.description}</p>}
            <p className="text-[11px] text-muted-foreground text-right">{description.length}/5000</p>
          </div>
        </CardContent>
      </Card>

      {/* ── Price & location ── */}
      <Card>
        <CardContent className="pt-7 flex flex-col gap-6">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary -mb-2">
            Precio y ubicación
          </p>

          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Precio (USD)</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[14px] pointer-events-none">$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(formatPriceInput(e.target.value))}
                placeholder="0.00"
                className="h-10 text-[13px] pl-7"
              />
            </div>
            {errors.price && <p className="text-[12px] text-destructive">{errors.price}</p>}
          </div>

          {/* Location */}
          <div className="flex flex-col gap-2">
            <Label className={labelClass}>Ubicación</Label>
            <LocationPicker
              latitude={coords?.lat ?? null}
              longitude={coords?.lng ?? null}
              searchHint={locationName}
              onChange={(lat, lng) => setCoords({ lat, lng })}
              onClear={() => { setCoords(null); setLocationName(''); }}
              onLocationName={setLocationName}
            />
            {locationName && (
              <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                <span className="text-primary">✓</span> {locationName}
              </p>
            )}
            {errors.location && <p className="text-[12px] text-destructive">{errors.location}</p>}
          </div>
        </CardContent>
      </Card>

      {/* ── Fotos ── */}
      <Card>
        <CardContent className="pt-7 flex flex-col gap-5">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary -mb-2">
            Fotos
          </p>

          {/* Existing photos */}
          {listing.photos && listing.photos.length > 0 && (
            <div>
              <p className="text-[11px] text-muted-foreground mb-3">
                {listing.photos.length} foto{listing.photos.length !== 1 ? 's' : ''} actuales
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
                {listing.photos.map((photo) => (
                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumbnailUrl ?? photo.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload new photos */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-3">
              Agregar fotos
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-[14px] px-6 py-8 text-center cursor-pointer transition-all duration-200',
                dragOver
                  ? 'border-primary bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]'
                  : 'border-border bg-card',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <ImagePlus size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-[13px] font-medium text-foreground mb-1">
                Arrastra fotos o haz clic para seleccionar
              </p>
              <p className="text-[11px] text-muted-foreground">JPG, PNG, WEBP · máx. 10</p>
            </div>

            {newPhotoPreviews.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] text-muted-foreground mb-2">
                  {newPhotoPreviews.length} foto{newPhotoPreviews.length !== 1 ? 's' : ''} nuevas
                </p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
                  {newPhotoPreviews.map((p, i) => (
                    <div key={p.url} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeNewPreview(i); }}
                        className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-black/60 text-white border-none cursor-pointer text-[10px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {uploadPhotos.isSuccess && uploadedCount > 0 && (
            <p className="text-[13px] text-[#6ECC96]">
              ✓ {uploadedCount} foto{uploadedCount !== 1 ? 's' : ''} subida{uploadedCount !== 1 ? 's' : ''}.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Estado ── */}
      <Card>
        <CardContent className="pt-7 flex flex-col gap-5">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary">
            Estado del anuncio
          </p>

          <div className="flex flex-col gap-2.5">
            {(
              [
                { value: 'active', label: 'Activo (visible públicamente)' },
                { value: 'draft', label: 'Borrador (no visible)' },
                { value: 'reserved', label: 'Reservado' },
                { value: 'sold', label: 'Vendido' },
              ] as const
            ).map((s) => (
              <label
                key={s.value}
                className={cn(
                  'flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border transition-all duration-150',
                  status === s.value
                    ? 'border-[var(--accent-dim)] bg-[var(--bg-elevated)]'
                    : 'border-[var(--border-light)] bg-transparent',
                )}
              >
                <input
                  type="radio"
                  name="status"
                  value={s.value}
                  checked={status === s.value}
                  onChange={() => setStatus(s.value)}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
                <span className="text-[13px] font-medium text-foreground">{s.label}</span>
              </label>
            ))}
          </div>

          {updateListing.error && (
            <div className="px-3.5 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-[13px] text-destructive">
              {(updateListing.error as Error).message}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 h-12 text-[14px]"
            >
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/listings/${listing.id}`)}
              disabled={isPending}
              className="h-12 px-6 text-[14px]"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
