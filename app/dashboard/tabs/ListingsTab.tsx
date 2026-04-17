'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ImageOff, Eye, Calendar, Heart, Mail,
  Plus, ChevronUp, ChevronDown, X, Trash2, BarChart2, ExternalLink, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { useMyListings, useListingStats, useDeleteListing } from '../../lib/hooks';
import { resolveMediaUrl } from '../../lib/api';
import { sileo } from 'sileo';
import type { ListingResponse } from '../../lib/types';
import EmptyState from '../../components/EmptyState';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const statusColor: Record<string, string> = {
  active:    '#5CC28A',
  reserved:  '#D49030',
  sold:      '#CC5252',
  draft:     '#6E8CB8',
  expired:   '#8A8A8A',
  suspended: '#A868A0',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

export function ListingStatsRow({ listing }: { listing: ListingResponse }) {
  const [expanded, setExpanded] = useState(false);
  const { data: stats, isLoading } = useListingStats(listing.id, expanded);
  const deleteListing = useDeleteListing();
  const photo = listing.photos?.[0];

  return (
    <Card className="overflow-hidden transition-colors duration-200">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-5 flex-wrap">
        <div className="w-16 h-12 rounded-md overflow-hidden bg-[var(--bg-elevated)] shrink-0">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(photo.thumbnailUrl ?? photo.url)}
              alt=""
              width={64}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageOff size={18} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-foreground truncate mb-0.5">{listing.title}</p>
          <div className="flex gap-2.5 items-center flex-wrap">
            <span className="text-[13px] text-primary font-medium">{formatPrice(listing.price)}</span>
            <span
              className="text-[10px] font-semibold tracking-[0.08em] uppercase"
              style={{ color: statusColor[listing.status] ?? 'var(--text-muted)' }}
            >
              {listing.status}
            </span>
            <span className="text-[11px] text-muted-foreground">{formatDate(listing.createdAt)}</span>
          </div>
        </div>

        <div className="flex gap-1.5 items-center shrink-0 flex-wrap">
          <Link href={`/listings/${listing.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <ExternalLink size={12} /> Ver
          </Link>
          <Button
            variant={expanded ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            <BarChart2 size={12} />
            Analíticas
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              sileo.action({
                title: '¿Eliminar este anuncio?',
                description: 'Esta acción no se puede deshacer.',
                button: { title: 'Eliminar', onClick: () => deleteListing.mutate(listing.id) },
              });
            }}
            disabled={deleteListing.isPending}
            className="text-[#CC6E6E] hover:text-[#CC6E6E] hover:bg-[color-mix(in_srgb,#CC6E6E_10%,transparent)]"
          >
            {deleteListing.isPending ? <X size={12} /> : <Trash2 size={12} />}
            {deleteListing.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </div>

      {expanded && (
        <>
          <Separator />
          <div className="px-5 py-3 bg-[var(--bg-elevated)]">
            {isLoading ? (
              <p className="text-[12px] text-muted-foreground">Cargando estadísticas…</p>
            ) : stats ? (
              <div className="flex flex-wrap gap-0 items-center">
                {[
                  { icon: <Eye size={11} />, label: 'Vistas', value: stats.totalViews },
                  { icon: <Calendar size={11} />, label: '7d', value: stats.viewsLast7Days },
                  { icon: <Calendar size={11} />, label: '30d', value: stats.viewsLast30Days },
                  { icon: <Heart size={11} />, label: 'Favoritos', value: stats.favoritesCount },
                  { icon: <Mail size={11} />, label: 'Solicitudes', value: stats.contactRequestsCount },
                ].map((s, i, arr) => (
                  <span key={s.label} className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                    <span className="text-muted-foreground flex items-center">{s.icon}</span>
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    <span className="font-semibold text-foreground text-[12px]">{s.value}</span>
                    {i < arr.length - 1 && <span className="mx-2 text-border select-none">·</span>}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">No se pudieron cargar las estadísticas</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

export default function ListingsTab() {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([]);

  const { data: listingsData, isLoading, isFetching } = useMyListings(cursor);
  const myListings = listingsData?.data ?? [];
  const meta = listingsData?.meta;

  const hasNext = !!meta?.hasNextPage && !!meta.nextCursor;
  const hasPrev = cursorHistory.length > 0;

  const goNext = () => {
    if (!meta?.nextCursor) return;
    setCursorHistory((h) => [...h, cursor]);
    setCursor(meta.nextCursor);
  };

  const goPrev = () => {
    setCursorHistory((h) => {
      const prev = h[h.length - 1];
      setCursor(prev);
      return h.slice(0, -1);
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <p className="text-[14px] text-muted-foreground">
          {myListings.length} anuncio{myListings.length !== 1 ? 's' : ''}
          {isFetching && !isLoading && <span className="ml-2 opacity-50">…</span>}
        </p>
        <Link href="/listings/new" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus size={14} /> Nuevo anuncio
        </Link>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-[13px]">Cargando…</p>
      ) : myListings.length > 0 ? (
        <>
          <div
            className="flex flex-col gap-3"
            style={{ opacity: isFetching ? 0.55 : 1, transition: 'opacity 0.18s ease' }}
          >
            {myListings.map((l) => <ListingStatsRow key={l.id} listing={l} />)}
          </div>

          {(hasPrev || hasNext) && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={!hasPrev || isFetching}
                className={cn('inline-flex items-center gap-1.5', !hasPrev && 'opacity-40')}
              >
                <ArrowLeft size={14} /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goNext}
                disabled={!hasNext || isFetching}
                className={cn('inline-flex items-center gap-1.5', !hasNext && 'opacity-40')}
              >
                Siguiente <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<ImageOff size={32} />}
          title="Sin anuncios aún"
          action={{ label: 'Crea tu primer anuncio', href: '/listings/new' }}
        />
      )}
    </>
  );
}
