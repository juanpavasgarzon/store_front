'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMyFavorites, useRemoveFavorite } from '../lib/hooks';
import { useProfile } from '../lib/hooks';
import type { FavoriteResponse } from '../lib/types';
import { Heart, HeartOff } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import EmptyState from '../components/EmptyState';
import type { ListingResponse } from '../lib/types';

// ─── Card wrapper: reuses ListingCard design, adds floating remove button ─────
function FavoriteCard({ fav }: { fav: FavoriteResponse }) {
  const remove = useRemoveFavorite(fav.listingId);

  // Fallback when listing data isn't included in the API response
  if (!fav.listing) {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      }}>
        <Link href={`/listings/${fav.listingId}`} style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
          Ver anuncio →
        </Link>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 11, color: '#CC6E6E', display: 'flex', alignItems: 'center', gap: 5 }}
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
        >
          <HeartOff size={13} /> {remove.isPending ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Reuse exact same ListingCard design */}
      <ListingCard listing={fav.listing as ListingResponse} />

      {/* Floating remove button — absolutely over the card photo area */}
      <button
        disabled={remove.isPending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          remove.mutate();
        }}
        title="Quitar de favoritos"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10,
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: remove.isPending
            ? 'rgba(0,0,0,0.4)'
            : 'color-mix(in srgb, #CC6E6E 90%, transparent)',
          backdropFilter: 'blur(6px)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: remove.isPending ? 'default' : 'pointer',
          color: '#fff',
          transition: 'opacity 0.15s, transform 0.15s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        <Heart size={14} fill="currentColor" />
      </button>
    </div>
  );
}

export default function FavoritesClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data, isLoading } = useMyFavorites();

  useEffect(() => {
    if (mounted && !profileLoading && !profile) {
      router.push('/auth/login?redirect=/favorites');
    }
  }, [mounted, profileLoading, profile, router]);

  if (!mounted) return null;

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <p>Cargando…</p>
      </div>
    );
  }

  if (!profile) return null;

  const favs = data?.data ?? [];

  return (
    <div className="container-wide" style={{ padding: '48px 24px', flex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
          FAVORITOS
        </p>
        <h1 className="page-heading" style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 300, marginBottom: 12 }}>
          Mis favoritos
        </h1>
        {!isLoading && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {favs.length === 0
              ? 'Todavía no has guardado ningún anuncio'
              : `${favs.length} anuncio${favs.length !== 1 ? 's' : ''} guardado${favs.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: 340, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : favs.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {favs.map((fav) => (
            <FavoriteCard key={fav.id} fav={fav} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Heart size={32} />}
          title="Aún no tienes favoritos"
          subtitle="Guarda los anuncios que te interesen para encontrarlos fácilmente."
          action={{ label: 'Explorar anuncios', href: '/listings' }}
        />
      )}
    </div>
  );
}
