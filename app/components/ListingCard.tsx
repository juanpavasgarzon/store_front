'use client';

import Link from 'next/link';
import type { ListingResponse } from '../lib/types';
import { resolveMediaUrl } from '../lib/api';
import { ImageOff, MapPin, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: ListingResponse;
  style?: React.CSSProperties;
  className?: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

const statusBadgeClass: Record<string, string> = {
  active:    'text-[#5CC28A] border-[#5CC28A]/30 bg-[color-mix(in_srgb,#5CC28A_12%,transparent)]',
  reserved:  'text-[#D49030] border-[#D49030]/30 bg-[color-mix(in_srgb,#D49030_12%,transparent)]',
  sold:      'text-[#CC5252] border-[#CC5252]/30 bg-[color-mix(in_srgb,#CC5252_12%,transparent)]',
  draft:     'text-[#6E8CB8] border-[#6E8CB8]/30 bg-[color-mix(in_srgb,#6E8CB8_12%,transparent)]',
  expired:   'text-[#8A8A8A] border-[#8A8A8A]/30 bg-[color-mix(in_srgb,#8A8A8A_12%,transparent)]',
  suspended: 'text-[#A868A0] border-[#A868A0]/30 bg-[color-mix(in_srgb,#A868A0_12%,transparent)]',
  deleted:   'text-[#CC5252] border-[#CC5252]/30 bg-[color-mix(in_srgb,#CC5252_12%,transparent)]',
};

const statusLabels: Record<string, string> = {
  active: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
  draft: 'Borrador',
  expired: 'Expirado',
  suspended: 'Suspendido',
  deleted:   'Eliminado',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return 'hace ' + days + 'd';
  if (days < 30) return 'hace ' + Math.floor(days / 7) + 'sem';
  return 'hace ' + Math.floor(days / 30) + 'mes';
}

export default function ListingCard({ listing, style, className }: ListingCardProps) {
  const photo = listing.photos?.[0];

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn('block no-underline group h-full', className)}
      style={style}
    >
      <Card className="overflow-hidden transition-all duration-200 hover:border-[var(--border-accent)] hover:shadow-lg h-full flex flex-col">
        {/* Photo */}
        <div className="relative h-[200px] bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(photo.thumbnailUrl ?? photo.url)}
              alt={listing.title}
              width={400}
              height={200}
              className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageOff size={28} />
            </div>
          )}

          {/* Status pill */}
          {listing.status !== 'active' && (
            <Badge
              variant="outline"
              className={cn(
                'absolute top-2.5 left-2.5 text-[10px] font-semibold tracking-wide uppercase backdrop-blur-sm',
                statusBadgeClass[listing.status] ?? statusBadgeClass.draft,
              )}
            >
              {statusLabels[listing.status] ?? listing.status}
            </Badge>
          )}
        </div>

        {/* Content */}
        <CardContent className="px-[18px] pt-4 pb-5 flex flex-col flex-1">
          {/* Category — reserved slot so cards without category stay aligned */}
          <div className="h-[18px] mb-1.5">
            {listing.category?.name && (
              <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-primary leading-none">
                {listing.category.name}
              </p>
            )}
          </div>

          {/* Title — fixed 2-line height regardless of actual line count */}
          <h3
            className="text-foreground leading-snug line-clamp-2 overflow-hidden h-[2.9rem]"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 400 }}
          >
            {listing.title}
          </h3>

          {/* Spacer pushes price/footer to bottom */}
          <div className="flex-1" />

          {/* Price + Location */}
          <div className="flex items-end justify-between gap-2 mt-2">
            <span className="price-tag flex-shrink-0">
              {formatPrice(listing.price)}
            </span>

            <span className="text-[11px] text-muted-foreground flex items-center gap-1 min-w-0">
              <MapPin size={11} className="flex-shrink-0" />
              <span className="truncate">{listing.location}</span>
            </span>
          </div>

          <Separator className="my-3" />

          {/* Footer */}
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-muted-foreground">
              {timeAgo(listing.createdAt)}
            </span>
            <span className="text-[11px] text-primary font-medium tracking-[0.04em]">
              <span className="inline-flex items-center gap-0.5">Ver <ArrowRight size={12} /></span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
