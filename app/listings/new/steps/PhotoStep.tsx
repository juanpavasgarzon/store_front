'use client';

import { useRef, useCallback } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export type PhotoEntry = { file: File; url: string };

export function PhotoStep({
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
