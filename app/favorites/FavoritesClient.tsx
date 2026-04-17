'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMyFavorites, useRemoveFavorite, useProfile } from '../lib/hooks';
import type { FavoriteResponse, ListingResponse } from '../lib/types';
import { Heart, HeartOff, ArrowRight } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import EmptyState from '../components/EmptyState';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function FavoriteCard({ fav }: { fav: FavoriteResponse }) {
  const remove = useRemoveFavorite(fav.listingId);

  if (!fav.listing) {
    return (
      <div className="bg-card border border-border rounded-xl px-5 py-4 flex justify-between items-center gap-3">
        <a
          href={`/listings/${fav.listingId}`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-primary text-[13px]')}
        >
          Ver anuncio <ArrowRight size={13} />
        </a>
        <Button
          variant="ghost"
          size="sm"
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
          className="text-[11px] text-[#CC6E6E] hover:text-[#CC6E6E] flex items-center gap-1"
        >
          <HeartOff size={13} /> {remove.isPending ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <ListingCard listing={fav.listing as ListingResponse} />
      <button
        disabled={remove.isPending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          remove.mutate();
        }}
        title="Quitar de favoritos"
        className={cn(
          'absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center',
          'text-white border-none cursor-pointer transition-transform hover:scale-110',
        )}
        style={{
          background: remove.isPending
            ? 'rgba(0,0,0,0.4)'
            : 'color-mix(in srgb, #CC6E6E 90%, transparent)',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
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
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>Cargando…</p>
      </div>
    );
  }

  if (!profile) return null;

  const favs = (data?.data ?? []).filter((f) => f.listing);

  return (
    <div className="container-wide py-12 pb-20 flex-1 px-6">
      <div className="mb-10">
        <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
          FAVORITOS
        </p>
        <h1 className="font-light mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
          Mis favoritos
        </h1>
        {!isLoading && (
          <p className="text-muted-foreground text-[14px]">
            {favs.length === 0
              ? 'Todavía no has guardado ningún anuncio'
              : `${favs.length} anuncio${favs.length !== 1 ? 's' : ''} guardado${favs.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[340px] bg-card rounded-xl border border-border opacity-40" />
          ))}
        </div>
      ) : favs.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
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
