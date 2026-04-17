'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateListing, useUploadPhotos } from '../../../lib/hooks';
import type { DetailsData } from './DetailsStep';
import type { PhotoEntry } from './PhotoStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'active' as const, label: 'Activo', sub: 'Visible de inmediato en el marketplace' },
  { value: 'draft' as const,  label: 'Borrador', sub: 'Guardado, no visible públicamente' },
];

export function PublicationStep({ details, photos }: { details: DetailsData; photos: PhotoEntry[] }) {
  const router = useRouter();
  const createListing = useCreateListing();
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const upload = useUploadPhotos(createdId ?? '');

  useEffect(() => {
    if (!createdId) return;
    if (photos.length === 0) { router.push(`/listings/${createdId}`); return; }
    upload.mutate(photos.map((p) => p.file), {
      onSuccess: () => router.push(`/listings/${createdId}`),
      onError: () => router.push(`/listings/${createdId}`),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdId]);

  const isPending = createListing.isPending || upload.isPending;

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
          className="w-12 h-12 rounded-full border-t-transparent"
          style={{ animation: 'spin 0.8s linear infinite', borderWidth: 3, borderStyle: 'solid', borderColor: '#6ECC96', borderTopColor: 'transparent' }}
        />
        <p className="text-[14px] font-medium text-foreground">
          {upload.isPending ? 'Subiendo fotos…' : 'Publicando…'}
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-7 flex flex-col gap-5">
        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-primary">Publicación</p>

        <div className="flex flex-col gap-2.5">
          {STATUS_OPTIONS.map((s) => (
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

        <Button onClick={handlePublish} disabled={isPending} className="w-full h-12 text-[14px]">
          {isPending ? 'Publicando…' : 'Publicar anuncio'}
        </Button>
      </CardContent>
    </Card>
  );
}
