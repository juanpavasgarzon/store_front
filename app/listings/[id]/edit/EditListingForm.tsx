'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEditListingForm } from './hooks/useEditListingForm';
import { DynamicAttributeField } from '../../../components/listings/DynamicAttributeField';
import { labelClass } from '../../utils';
import type { ListingResponse } from '../../../lib/types';
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

const STATUS_OPTIONS = [
  { value: 'active'  as const, label: 'Activo (visible públicamente)' },
  { value: 'draft'   as const, label: 'Borrador (no visible)' },
  { value: 'reserved'as const, label: 'Reservado' },
  { value: 'sold'    as const, label: 'Vendido' },
];

export default function EditListingForm({ listing }: { listing: ListingResponse }) {
  const router = useRouter();
  const form = useEditListingForm(listing);

  if (form.profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Cargando…</p>
      </div>
    );
  }

  if (!form.profile || form.profile.id !== listing.userId) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Main info */}
      <Card>
        <CardContent className="pt-7 flex flex-col gap-6">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary -mb-2">Información principal</p>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Categoría</Label>
            <Select value={form.categoryId} onValueChange={(v) => v && form.handleCategoryChange(v)} disabled={form.catsLoading}>
              <SelectTrigger className="text-[13px] h-10">
                <SelectValue placeholder={form.catsLoading ? 'Cargando…' : 'Selecciona una categoría'}>
                  {(v: string) => form.cats.find((c) => c.id === v)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {form.cats.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} label={cat.name} className="text-[13px]">{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.errors.categoryId && <p className="text-[12px] text-destructive">{form.errors.categoryId}</p>}
          </div>

          {form.categoryId && form.categoryAttributes.length > 0 && (
            <>
              <Separator />
              <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary -mb-2">Características específicas</p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
                {form.categoryAttributes.map((attribute) => (
                  <div key={attribute.id} className="flex flex-col gap-1.5">
                    <Label className={labelClass}>
                      {attribute.name}
                      {attribute.isRequired && <span className="text-primary ml-1">*</span>}
                    </Label>
                    <DynamicAttributeField
                      attribute={attribute}
                      value={form.attributeValues[attribute.id] ?? ''}
                      onChange={(value) => form.setAttributeValues((p) => ({ ...p, [attribute.id]: value }))}
                    />
                    {form.errors[attribute.id] && <p className="text-[12px] text-destructive">{form.errors[attribute.id]}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Título</Label>
            <Input
              type="text"
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder="Describe tu artículo en pocas palabras"
              maxLength={255}
              className="h-10 text-[13px]"
            />
            {form.errors.title && <p className="text-[12px] text-destructive">{form.errors.title}</p>}
            <p className="text-[11px] text-muted-foreground text-right">{form.title.length}/255</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Descripción</Label>
            <textarea
              value={form.description}
              onChange={(e) => form.setDescription(e.target.value)}
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
            {form.errors.description && <p className="text-[12px] text-destructive">{form.errors.description}</p>}
            <p className="text-[11px] text-muted-foreground text-right">{form.description.length}/5000</p>
          </div>
        </CardContent>
      </Card>

      {/* Price & location */}
      <Card>
        <CardContent className="pt-7 flex flex-col gap-6">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary -mb-2">Precio y ubicación</p>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Precio (USD)</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-[14px] pointer-events-none">$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => form.setPrice(e.target.value)}
                placeholder="0.00"
                className="h-10 text-[13px] pl-7"
              />
            </div>
            {form.errors.price && <p className="text-[12px] text-destructive">{form.errors.price}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label className={labelClass}>Ubicación</Label>
            <LocationPicker
              latitude={form.coords?.lat ?? null}
              longitude={form.coords?.lng ?? null}
              searchHint={form.locationName}
              onChange={(lat, lng) => form.setCoords({ lat, lng })}
              onClear={() => { form.setCoords(null); form.setLocationName(''); }}
              onLocationName={form.setLocationName}
            />
            {form.locationName && (
              <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                <span className="text-primary">✓</span> {form.locationName}
              </p>
            )}
            {form.errors.location && <p className="text-[12px] text-destructive">{form.errors.location}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardContent className="pt-7 flex flex-col gap-5">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary -mb-2">Fotos</p>

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

          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-3">Agregar fotos</p>
            <div
              onDragOver={(e) => { e.preventDefault(); form.setDragOver(true); }}
              onDragLeave={() => form.setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); form.setDragOver(false); form.addFiles(e.dataTransfer.files); }}
              onClick={() => form.fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-[14px] px-6 py-8 text-center cursor-pointer transition-all duration-200',
                form.dragOver ? 'border-primary bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]' : 'border-border bg-card',
              )}
            >
              <input
                ref={form.fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => form.addFiles(e.target.files)}
              />
              <ImagePlus size={24} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-[13px] font-medium text-foreground mb-1">Arrastra fotos o haz clic para seleccionar</p>
              <p className="text-[11px] text-muted-foreground">JPG, PNG, WEBP · máx. 10</p>
            </div>

            {form.newPhotoPreviews.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] text-muted-foreground mb-2">
                  {form.newPhotoPreviews.length} foto{form.newPhotoPreviews.length !== 1 ? 's' : ''} nuevas
                </p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
                  {form.newPhotoPreviews.map((p, i) => (
                    <div key={p.url} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); form.removeNewPreview(i); }}
                        className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-black/60 text-white border-none cursor-pointer text-[10px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.uploadSuccess && form.uploadedCount > 0 && (
              <p className="text-[13px] text-[#6ECC96] mt-3">
                ✓ {form.uploadedCount} foto{form.uploadedCount !== 1 ? 's' : ''} subida{form.uploadedCount !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardContent className="pt-7 flex flex-col gap-5">
          <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary">Estado del anuncio</p>

          <div className="flex flex-col gap-2.5">
            {STATUS_OPTIONS.map((s) => (
              <label
                key={s.value}
                className={cn(
                  'flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border transition-all duration-150',
                  form.status === s.value
                    ? 'border-[var(--accent-dim)] bg-[var(--bg-elevated)]'
                    : 'border-[var(--border-light)] bg-transparent',
                )}
              >
                <input
                  type="radio"
                  name="status"
                  value={s.value}
                  checked={form.status === s.value}
                  onChange={() => form.setStatus(s.value)}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
                <span className="text-[13px] font-medium text-foreground">{s.label}</span>
              </label>
            ))}
          </div>

          {form.saveError && (
            <div className="px-3.5 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-[13px] text-destructive">
              {(form.saveError as Error).message}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={form.handleSave} disabled={form.isPending} className="flex-1 h-12 text-[14px]">
              {form.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/listings/${listing.id}`)}
              disabled={form.isPending}
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
