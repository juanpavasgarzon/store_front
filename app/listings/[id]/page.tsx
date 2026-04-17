import { notFound } from 'next/navigation';
import Link from 'next/link';
import { listings } from '../../lib/api';
import Navbar from '../../components/Navbar';
import PhotoCarousel from '../../components/PhotoCarousel';
import ListingMapClient from '../../components/ListingMapClient';
import ContactButton from './ContactButton';
import EditButton from './EditButton';
import ShareButton from './ShareButton';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import type { ListingResponse } from '../../lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const listing = await listings.get(id);
    return { title: listing.title, description: listing.description.slice(0, 160) };
  } catch {
    return { title: 'Not found' };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;

  let listing: ListingResponse;
  try {
    listing = await listings.get(id);
  } catch {
    notFound();
  }

  const photos = listing.photos ?? [];

  const statusLabels: Record<string, string> = {
    active: 'Disponible', reserved: 'Reservado', sold: 'Vendido',
    draft: 'Borrador', expired: 'Expirado', suspended: 'Suspendido',
  };
  const statusLabel = statusLabels[listing.status] ?? listing.status;

  const whatsappNumber = listing.seller?.phone?.replace(/\D/g, '');
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, me interesa tu anuncio: ${listing.title}`)}`
    : null;

  return (
    <>
      <Navbar />

      <div className="container-wide" style={{ padding: '40px 24px 80px', flex: 1 }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{'Inicio'}</Link>
          <span>›</span>
          <Link href="/listings" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{'Anuncios'}</Link>
          {listing.category?.name && (
            <>
              <span>›</span>
              <Link href={`/listings?categoryId=${listing.categoryId}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                {listing.category.name}
              </Link>
            </>
          )}
          <span>›</span>
          <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '20ch' }}>{listing.title}</span>
        </nav>

        <div className="layout-detail">
          {/* ── Main ────────────────────────────────────────────────────── */}
          <div>
            {/* Photos */}
            <div style={{ marginBottom: 40 }}>
              <PhotoCarousel photos={photos} title={listing.title} />
            </div>

            {/* Title + category */}
            <div style={{ marginBottom: 32 }}>
              {listing.category?.name && (
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
                  {listing.category.name}
                </p>
              )}
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 400, lineHeight: 1.15, marginBottom: 16 }}>
                {listing.title}
              </h1>
            </div>

            {/* Attribute values */}
            {listing.attributeValues && listing.attributeValues.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, marginBottom: 20 }}>
                  {'Características'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {listing.attributeValues.map((attributeValue) => (
                    <div
                      key={attributeValue.id}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                      }}
                    >
                      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                        {attributeValue.attributeName}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {attributeValue.valueType === 'boolean'
                          ? (attributeValue.value === 'true' ? 'Sí' : 'No')
                          : attributeValue.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, marginBottom: 16 }}>{'Descripción'}</h2>
              <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{listing.description}</div>
            </div>

            {/* Map */}
            {listing.latitude != null && listing.longitude != null && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, marginBottom: 16 }}>
                  {'Ubicación'}
                </h2>
                <ListingMapClient
                  latitude={listing.latitude}
                  longitude={listing.longitude}
                  title={listing.title}
                />
              </div>
            )}
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="detail-sidebar" style={{ position: 'sticky', top: 84 }}>
            <EditButton listingId={listing.id} ownerId={listing.userId} />
            <ShareButton title={listing.title} />
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 24px', marginBottom: 16 }}>
              <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Price row */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>
                    Precio
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.55rem', fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'var(--accent-light)' }}>
                    {formatPrice(listing.price)}
                  </p>
                </div>
                {/* Status row */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>
                    Estado
                  </p>
                  <span className={`status-badge status-${listing.status}`}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {statusLabel}
                  </span>
                </div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 20 }} />
              {listing.status === 'active' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* WhatsApp — primary CTA when seller has it */}
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(buttonVariants(), 'w-full justify-center')}
                    >
                      Contactar por WhatsApp
                    </a>
                  )}
                  <ContactButton listingId={listing.id} type="contact" listingUserId={listing.userId} />
                  <ContactButton listingId={listing.id} type="favorite" listingUserId={listing.userId} />
                </div>
              )}
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>{'Info del anuncio'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Referencia', listing.code],
                  ['Ubicación', [listing.city, listing.location, listing.sector].filter(Boolean).join(', ')],
                  ['Publicado', formatDate(listing.createdAt)],
                  ...(listing.expiresAt ? [['Vence', formatDate(listing.expiresAt)]] : []),
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <ContactButton listingId={listing.id} type="report" />
          </aside>
        </div>
      </div>
    </>
  );
}
