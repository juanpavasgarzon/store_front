'use client';

import Link from 'next/link';
import type { ListingResponse } from '../lib/types';
import { resolveMediaUrl } from '../lib/api';
import { ImageOff, MapPin } from 'lucide-react';

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

export default function ListingCard({ listing, style, className }: ListingCardProps) {

  const photo = listing.photos?.[0];
  const statusColors: Record<string, string> = {
    active: '#6ECC96',
    reserved: '#A4C46E',
    sold: '#CC6E6E',
    draft: '#9A8C7C',
    expired: '#CC9E6E',
    suspended: '#8C7D6E',
  };
  const statusColor = statusColors[listing.status] ?? '#9A8C7C';

  const statusLabels: Record<string, string> = {
    active: 'Disponible',
    reserved: 'Reservado',
    sold: 'Vendido',
    draft: 'Borrador',
    expired: 'Expirado',
    suspended: 'Suspendido',
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

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`card ${className ?? ''}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        ...style,
      }}
    >
      {/* Photo */}
      <div
        style={{
          position: 'relative',
          height: 200,
          background: 'var(--bg-elevated)',
          overflow: 'hidden',
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveMediaUrl(photo.thumbnailUrl ?? photo.url)}
            alt={listing.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)';
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <ImageOff size={28} />
          </div>
        )}

        {/* Status pill */}
        {listing.status !== 'active' && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: 'color-mix(in srgb, var(--bg-canvas) 80%, transparent)',
              color: statusColor,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 4,
              backdropFilter: 'blur(8px)',
              border: `1px solid color-mix(in srgb, ${statusColor} 30%, transparent)`,
            }}
          >
            {statusLabels[listing.status] ?? listing.status}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 18px 20px' }}>
        {/* Category */}
        {listing.category?.name && (
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 6,
            }}
          >
            {listing.category.name}
          </p>
        )}

        {/* Title */}
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            fontWeight: 400,
            color: 'var(--text-primary)',
            marginBottom: 8,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {listing.title}
        </h3>

        {/* Price + Location */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span className="price-tag" style={{ fontSize: '1.1rem' }}>
            {formatPrice(listing.price)}
          </span>

          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MapPin size={11} />
            {listing.location}
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {timeAgo(listing.createdAt)}
          </span>
          <span
            style={{
              fontSize: 11,
              color: 'var(--accent)',
              fontWeight: 500,
              letterSpacing: '0.04em',
            }}
          >
            {'Ver →'}
          </span>
        </div>
      </div>
    </Link>
  );
}
