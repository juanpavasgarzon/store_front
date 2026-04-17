'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateListing, useUploadPhotos, usePublicCategories, useCategoryAttributes, useProfile } from '../../../../lib/hooks';
import type { ListingResponse } from '../../../../lib/types';
import { formatPriceDisplay, formatPriceInput } from '../../../utils';

export type PhotoPreview = { file: File; url: string };

export function useEditListingForm(listing: ListingResponse) {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateListing = useUpdateListing();
  const uploadPhotos = useUploadPhotos(listing.id);
  const { data: catsData, isLoading: catsLoading } = usePublicCategories();
  const cats = catsData?.data ?? [];

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
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    listing.attributeValues?.forEach((av) => { init[av.attributeId] = av.value; });
    return init;
  });

  const { data: categoryAttributes = [] } = useCategoryAttributes(categoryId || null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<PhotoPreview[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profileLoading && profile && profile.id !== listing.userId) {
      router.replace(`/listings/${listing.id}`);
    }
    if (!profileLoading && !profile) {
      router.replace(`/auth/login?redirect=/listings/${listing.id}/edit`);
    }
  }, [profileLoading, profile, listing.id, listing.userId, router]);

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

  const parsedPrice = () => parseFloat(price.replace(/,/g, ''));

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!categoryId) errs.categoryId = 'Selecciona una categoría';
    if (!title.trim()) errs.title = 'El título es requerido';
    if (description.trim().length < 10) errs.description = 'Mín. 10 caracteres';
    if (isNaN(parsedPrice()) || parsedPrice() < 0) errs.price = 'Precio inválido';
    if (!locationName.trim() && !coords) errs.location = 'Busca tu ubicación o coloca un pin en el mapa';
    categoryAttributes.filter((a) => a.isRequired).forEach((a) => {
      if (!attributeValues[a.id]?.trim()) errs[a.id] = `${a.name} es requerido`;
    });
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const attributeValuesPayload = Object.entries(attributeValues)
      .filter(([, v]) => v !== '')
      .map(([attributeId, value]) => ({ attributeId, value }));

    const loc = locationName.trim() || (coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : listing.location);
    const payload: Record<string, unknown> = {
      categoryId, title: title.trim(), description: description.trim(),
      price: parsedPrice(), location: loc, status, attributeValues: attributeValuesPayload,
    };
    if (coords) { payload.latitude = coords.lat; payload.longitude = coords.lng; }

    updateListing.mutate({ id: listing.id, data: payload }, {
      onSuccess: () => {
        if (newPhotoPreviews.length > 0) {
          uploadPhotos.mutate(newPhotoPreviews.map((p) => p.file), {
            onSuccess: (res) => { setUploadedCount(res.length); setTimeout(() => router.push(`/listings/${listing.id}`), 800); },
            onError: () => router.push(`/listings/${listing.id}`),
          });
        } else {
          router.push(`/listings/${listing.id}`);
        }
      },
    });
  };

  return {
    // data
    cats, categoryAttributes, profile, profileLoading,
    catsLoading,
    // form state
    categoryId, title, description, price, locationName, status, coords, attributeValues,
    newPhotoPreviews, dragOver, uploadedCount, errors, fileInputRef,
    // setters
    setCategoryId, setTitle, setDescription, setLocationName, setStatus, setCoords,
    setAttributeValues, setDragOver,
    // handlers
    handleCategoryChange, addFiles, removeNewPreview, handleSave,
    setPrice: (raw: string) => setPrice(formatPriceInput(raw)),
    // mutation state
    isPending: updateListing.isPending || uploadPhotos.isPending,
    saveError: updateListing.error,
    uploadSuccess: uploadPhotos.isSuccess,
  };
}
