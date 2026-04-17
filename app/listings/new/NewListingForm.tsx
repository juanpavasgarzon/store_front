'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  useCreateListing, usePublicCategories, useUploadPhotos, useCategoryAttributes,
} from '../../lib/hooks';
import type { CategoryAttributeResponse } from '../../lib/types/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const LocationPicker = dynamic(() => import('../../components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface DetailsData {
  categoryId: string;
  title: string;
  description: string;
  price: number;
  location: string;
  latitude?: number;
  longitude?: number;
  attributeValues: { attributeId: string; value: string }[];
}

type AttributeValues = Record<string, string>;
type PhotoEntry = { file: File; url: string };

function formatPriceInput(raw: string): string {
  const clean = raw.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
}

const labelClass = 'text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground';

// ─── Dynamic attribute field ──────────────────────────────────────────────────

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

// ─── Step 1: Detalles ─────────────────────────────────────────────────────────

function DetailsStep({ onNext }: { onNext: (data: DetailsData) => void }) {
  const { data: catsData, isLoading: catsLoading } = usePublicCategories();
  const cats = catsData?.data ?? [];

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('');
  const [attributeValues, setAttributeValues] = useState<AttributeValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: categoryAttributes = [], isLoading: attributesLoading } = useCategoryAttributes(
    categoryId || null,
  );

  const parsedPrice = () => parseFloat(price.replace(/,/g, ''));

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!categoryId) errs.categoryId = 'Selecciona una categoría';
    if (!title.trim()) errs.title = 'El título es requerido';
    if (description.trim().length < 10) errs.description = 'La descripción debe tener al menos 10 caracteres';
    const p = parsedPrice();
    if (isNaN(p) || p < 0) errs.price = 'Ingresa un precio válido';
    if (!locationName.trim() && !coords) errs.location = 'Busca tu ubicación o coloca un pin en el mapa';
    return errs;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const attributeValuesPayload = Object.entries(attributeValues)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([attributeId, value]) => ({ attributeId, value }));

    const loc = locationName.trim() || (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : '');

    const data: DetailsData = {
      categoryId,
      title: title.trim(),
      description: description.trim(),
      price: parsedPrice(),
      location: loc,
      attributeValues: attributeValuesPayload,
    };
    if (coords) { data.latitude = coords.lat; data.longitude = coords.lng; }

    onNext(data);
  };

  return (
    <form onSubmit={handleNext} noValidate>
      <Card>
        <CardContent className="pt-7 flex flex-col gap-5">
          {/* Row 1: Category | Title */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Categoría</Label>
              <Select value={categoryId} onValueChange={(v) => { if (v) { setCategoryId(v); setAttributeValues({}); } }} disabled={catsLoading}>
                <SelectTrigger className="text-[13px] h-10">
                  <SelectValue placeholder={catsLoading ? 'Cargando…' : 'Selecciona'}>
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

            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Título</Label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Describe tu artículo"
                maxLength={255}
                className="h-10 text-[13px]"
              />
              {errors.title && <p className="text-[12px] text-destructive">{errors.title}</p>}
            </div>
          </div>

          {/* Dynamic attributes */}
          {categoryId && !attributesLoading && categoryAttributes.length > 0 && (
            <>
              <Separator />
              <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary -mb-1">
                Características específicas
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
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
              <Separator />
            </>
          )}

          {/* Row 2: Description */}
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Descripción</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción detallada (mín. 10 caracteres)"
              minLength={10}
              maxLength={5000}
              rows={5}
              className={cn(
                'w-full px-[14px] py-[11px] rounded-lg border border-input bg-transparent dark:bg-input/30 text-[13px]',
                'text-foreground resize-y leading-relaxed outline-none transition-colors',
                'focus:border-[var(--accent-dim)] placeholder:text-muted-foreground',
              )}
            />
            {errors.description && <p className="text-[12px] text-destructive">{errors.description}</p>}
            <p className="text-[11px] text-muted-foreground text-right">{description.length}/5000</p>
          </div>

          {/* Row 3: Price */}
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

          {/* Row 4-5: Location (search + map) */}
          <div className="flex flex-col gap-2">
            <Label className={labelClass}>Ubicación</Label>
            <LocationPicker
              latitude={coords?.lat ?? null}
              longitude={coords?.lng ?? null}
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

          <Button type="submit" className="w-full h-11 text-[14px] mt-1 inline-flex items-center gap-2">
            Siguiente <ArrowRight size={15} />
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

// ─── Step 2: Fotos ────────────────────────────────────────────────────────────

function PhotoStep({
  photos,
  setPhotos,
  onNext,
}: {
  photos: PhotoEntry[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoEntry[]>>;
  onNext: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const next = valid.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...next].slice(0, 10));
  }, [setPhotos]);

  const removePhoto = (i: number) => {
    setPhotos((p) => {
      URL.revokeObjectURL(p[i].url);
      return p.filter((_, idx) => idx !== i);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-[14px] px-6 py-14 text-center cursor-pointer transition-all duration-200',
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
        <p className="text-[32px] mb-3 text-muted-foreground">◈</p>
        <p className="text-[15px] font-medium text-foreground mb-1.5">
          Arrastra fotos aquí o haz clic para seleccionar
        </p>
        <p className="text-[12px] text-muted-foreground">JPG, PNG, WEBP · máx. 10 fotos</p>
      </div>

      {photos.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-3">
            {photos.length} foto{photos.length !== 1 ? 's' : ''} seleccionada{photos.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
            {photos.map((p, i) => (
              <div key={p.url} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                  className="absolute top-1 right-1 w-[22px] h-[22px] rounded-full bg-black/60 text-white border-none cursor-pointer text-[12px] flex items-center justify-center"
                >
                  ✕
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[9px] font-bold uppercase tracking-[0.06em] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    Principal
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button onClick={onNext} className="w-full h-11 text-[14px]">
        <span className="inline-flex items-center gap-2">
        {photos.length === 0 ? 'Omitir fotos' : `Continuar con ${photos.length} foto${photos.length !== 1 ? 's' : ''}`}
        <ArrowRight size={15} />
      </span>
      </Button>
    </div>
  );
}

// ─── Step 3: Publicación ──────────────────────────────────────────────────────

function PublicationStep({
  details,
  photos,
}: {
  details: DetailsData;
  photos: PhotoEntry[];
}) {
  const router = useRouter();
  const createListing = useCreateListing();
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const upload = useUploadPhotos(createdId ?? '');

  useEffect(() => {
    if (!createdId) return;
    if (photos.length === 0) {
      router.push(`/listings/${createdId}`);
      return;
    }
    upload.mutate(photos.map((p) => p.file), {
      onSuccess: () => router.push(`/listings/${createdId}`),
      onError: () => router.push(`/listings/${createdId}`),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdId]);

  const isUploading = upload.isPending;
  const isPending = createListing.isPending || isUploading;

  const handlePublish = () => {
    createListing.mutate(
      { ...details, status } as Record<string, unknown>,
      { onSuccess: (listing) => setCreatedId(listing.id) },
    );
  };

  if (createdId) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div
          className="w-12 h-12 rounded-full border-3 border-[#6ECC96] border-t-transparent"
          style={{ animation: 'spin 0.8s linear infinite', borderWidth: 3 }}
        />
        <p className="text-[14px] font-medium text-foreground">
          {isUploading ? 'Subiendo fotos…' : 'Publicando…'}
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-7 flex flex-col gap-5">
        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary">
          Publicación
        </p>

        <div className="flex flex-col gap-2.5">
          {(
            [
              { value: 'active', label: 'Activo', sub: 'Visible de inmediato en el marketplace' },
              { value: 'draft', label: 'Borrador', sub: 'Guardado, no visible públicamente' },
            ] as const
          ).map((s) => (
            <label
              key={s.value}
              className={cn(
                'flex items-start gap-3 cursor-pointer px-4 py-3.5 rounded-lg border transition-all duration-150',
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
                className="w-4 h-4 mt-0.5 accent-[var(--accent)]"
              />
              <div>
                <p className="text-[13px] font-medium text-foreground">{s.label}</p>
                <p className="text-[11px] text-muted-foreground">{s.sub}</p>
              </div>
            </label>
          ))}
        </div>

        {photos.length > 0 && (
          <p className="text-[12px] text-muted-foreground">
            Se subirán {photos.length} foto{photos.length !== 1 ? 's' : ''} al publicar.
          </p>
        )}

        {createListing.error && (
          <div className="px-3.5 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-[13px] text-destructive">
            {(createListing.error as Error).message}
          </div>
        )}

        <Button
          onClick={handlePublish}
          disabled={isPending}
          className="w-full h-12 text-[14px]"
        >
          {isPending ? 'Publicando…' : 'Publicar anuncio'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Detalles' },
  { n: 2, label: 'Fotos' },
  { n: 3, label: 'Publicación' },
];

export default function NewListingForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [details, setDetails] = useState<DetailsData | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map((s, i) => {
          const done = step > s.n;
          const active = step === s.n;
          return (
            <div key={s.n} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                  style={{
                    background: done ? '#6ECC96' : active ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: done || active ? '#000' : 'var(--text-muted)',
                    fontSize: done ? 16 : 13,
                    fontWeight: 700,
                    border: `2px solid ${done ? '#6ECC96' : active ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  {done ? '✓' : s.n}
                </div>
                <span
                  className="text-[11px] whitespace-nowrap"
                  style={{
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="w-16 h-0.5 mx-2 mb-[22px] shrink-0 transition-colors duration-300"
                  style={{ background: done ? '#6ECC96' : 'var(--border)' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <DetailsStep onNext={(data) => { setDetails(data); setStep(2); }} />
      )}
      {step === 2 && (
        <PhotoStep photos={photos} setPhotos={setPhotos} onNext={() => setStep(3)} />
      )}
      {step === 3 && details && (
        <PublicationStep details={details} photos={photos} />
      )}
    </div>
  );
}
