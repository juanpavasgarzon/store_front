'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePublicCategories, useCategoryAttributes } from '../../../lib/hooks';
import type { CategoryAttributeResponse } from '../../../lib/types/categories';
import { DynamicAttributeField } from '../../../components/listings/DynamicAttributeField';
import { labelClass, formatPriceInput } from '../../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const LocationPicker = dynamic(() => import('../../../components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
  ),
});

export interface DetailsData {
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

function validate(
  categoryId: string, title: string, description: string,
  price: string, locationName: string, coords: { lat: number; lng: number } | null,
  categoryAttributes: CategoryAttributeResponse[], attributeValues: AttributeValues,
): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!categoryId) errs.categoryId = 'Selecciona una categoría';
  if (!title.trim()) errs.title = 'El título es requerido';
  if (description.trim().length < 10) errs.description = 'La descripción debe tener al menos 10 caracteres';
  const p = parseFloat(price.replace(/,/g, ''));
  if (isNaN(p) || p < 0) errs.price = 'Ingresa un precio válido';
  if (!locationName.trim() && !coords) errs.location = 'Busca tu ubicación o coloca un pin en el mapa';
  categoryAttributes.filter((a) => a.isRequired).forEach((a) => {
    if (!attributeValues[a.id]?.trim()) errs[a.id] = `${a.name} es requerido`;
  });
  return errs;
}

export function DetailsStep({ onNext }: { onNext: (data: DetailsData) => void }) {
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

  const { data: categoryAttributes = [] } = useCategoryAttributes(categoryId || null);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(categoryId, title, description, price, locationName, coords, categoryAttributes, attributeValues);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const parsedPrice = parseFloat(price.replace(/,/g, ''));
    const loc = locationName.trim() || (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : '');
    const attributeValuesPayload = Object.entries(attributeValues)
      .filter(([, v]) => v !== '')
      .map(([attributeId, value]) => ({ attributeId, value }));

    const data: DetailsData = {
      categoryId, title: title.trim(), description: description.trim(),
      price: parsedPrice, location: loc, attributeValues: attributeValuesPayload,
    };
    if (coords) { data.latitude = coords.lat; data.longitude = coords.lng; }
    onNext(data);
  };

  return (
    <form onSubmit={handleNext} noValidate>
      <Card>
        <CardContent className="pt-7 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Categoría</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => { if (v) { setCategoryId(v); setAttributeValues({}); } }}
                disabled={catsLoading}
              >
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

          {categoryId && categoryAttributes.length > 0 && (
            <>
              <Separator />
              <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary -mb-1">
                Características específicas
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                {categoryAttributes.map((attribute: CategoryAttributeResponse) => (
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
                    {errors[attribute.id] && <p className="text-[12px] text-destructive">{errors[attribute.id]}</p>}
                  </div>
                ))}
              </div>
              <Separator />
            </>
          )}

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
