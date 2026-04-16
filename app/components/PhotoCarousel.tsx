'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, X, ZoomIn } from 'lucide-react';
import { resolveMediaUrl } from '../lib/api';

interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string | null;
}

interface Props {
  photos: Photo[];
  title: string;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ photos, startIndex, onClose }: { photos: Photo[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % photos.length), [photos.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
        aria-label="Cerrar"
      >
        <X size={18} />
      </button>

      {/* Counter */}
      <span style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
      }}>
        {current + 1} / {photos.length}
      </span>

      {/* Prev */}
      {photos.length > 1 && (
        <button
          onClick={prev}
          style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          aria-label="Foto anterior"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Main image */}
      <div style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photos[current].url}
          src={resolveMediaUrl(photos[current].url)}
          alt={`Foto ${current + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: 8,
            animation: 'fade-in 0.2s ease both',
          }}
        />
      </div>

      {/* Next */}
      {photos.length > 1 && (
        <button
          onClick={next}
          style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          aria-label="Siguiente foto"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6,
        }}>
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrent(i)}
              style={{
                width: 48, height: 34, borderRadius: 4, overflow: 'hidden', padding: 0, cursor: 'pointer',
                border: `2px solid ${i === current ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                transition: 'border-color 0.15s', background: '#000',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveMediaUrl(p.thumbnailUrl ?? p.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main carousel ───────────────────────────────────────────────────────────
export default function PhotoCarousel({ photos, title }: Props) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (photos.length === 0) {
    return (
      <div style={{
        borderRadius: 12, border: '1px solid var(--border)',
        background: 'var(--bg-elevated)', aspectRatio: '16/9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)',
      }}>
        <ImageOff size={48} />
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length);
  const next = () => setCurrent((c) => (c + 1) % photos.length);

  const navBtn: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'color-mix(in srgb, var(--bg-canvas) 80%, transparent)',
    backdropFilter: 'blur(8px)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'all 0.15s',
  };

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        {/* Main image — click to open lightbox */}
        <div
          style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-elevated)', border: '1px solid var(--border)', aspectRatio: '16/9', cursor: 'zoom-in' }}
          onClick={() => setLightboxOpen(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveMediaUrl(photos[current].url)}
            alt={`${title} — foto ${current + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.03)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
          />

          {/* Zoom hint */}
          <span style={{
            position: 'absolute', top: 10, right: 12,
            background: 'color-mix(in srgb, var(--bg-canvas) 75%, transparent)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border)',
            borderRadius: 6, padding: '4px 8px',
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, color: 'var(--text-secondary)',
            pointerEvents: 'none',
          }}>
            <ZoomIn size={12} /> Ampliar
          </span>

          {/* Counter pill */}
          {photos.length > 1 && (
            <span style={{
              position: 'absolute', bottom: 10, right: 12,
              background: 'color-mix(in srgb, var(--bg-canvas) 80%, transparent)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              fontSize: 11, fontWeight: 600,
              padding: '3px 10px',
              color: 'var(--text-primary)',
            }}>
              {current + 1} / {photos.length}
            </span>
          )}

          {/* Prev / Next — stop propagation so they don't open lightbox */}
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} style={{ ...navBtn, left: 10 }} aria-label="Foto anterior">
                <ChevronLeft size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ ...navBtn, right: 10 }} aria-label="Siguiente foto">
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setCurrent(i)}
                style={{
                  flexShrink: 0,
                  width: 72,
                  height: 52,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: `2px solid ${i === current ? 'var(--accent)' : 'var(--border)'}`,
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  background: 'var(--bg-elevated)',
                }}
                aria-label={`Ver foto ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(photo.thumbnailUrl ?? photo.url)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          photos={photos}
          startIndex={current}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
