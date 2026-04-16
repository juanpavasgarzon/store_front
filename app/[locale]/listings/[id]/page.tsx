import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '../../../../i18n/navigation';
import { listings, ratings } from '../../../lib/api';
import Navbar from '../../../components/Navbar';
import StarRating from '../../../components/StarRating';
import PhotoCarousel from '../../../components/PhotoCarousel';
import ContactButton from './ContactButton';
import CommentsSection from './CommentsSection';
import type { Metadata } from 'next';
import type { ListingResponse } from '../../../lib/types';

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
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

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-CO' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const t = await getTranslations('listing');

  let listing: ListingResponse;
  try {
    listing = await listings.get(id);
  } catch {
    notFound();
  }

  const ratingSummaryRes = await ratings.getSummary(id).catch(() => null);
  const ratingSummary = ratingSummaryRes ?? null;
  const photos = listing.photos ?? [];

  const statusLabelKey = `status${listing.status.charAt(0).toUpperCase()}${listing.status.slice(1)}` as
    | 'statusActive' | 'statusReserved' | 'statusSold' | 'statusDraft' | 'statusExpired' | 'statusSuspended';

  return (
    <>
      <Navbar />

      <div className="container-wide" style={{ padding: '40px 24px 80px', flex: 1 }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('home')}</Link>
          <span>›</span>
          <Link href="/listings" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('listings')}</Link>
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
            {/* Photos — interactive carousel */}
            <div style={{ marginBottom: 40 }}>
              <PhotoCarousel photos={photos} title={listing.title} />
            </div>

            {/* Title */}
            <div style={{ marginBottom: 32 }}>
              {listing.category?.name && (
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
                  {listing.category.name}
                </p>
              )}
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 400, lineHeight: 1.15, marginBottom: 16 }}>
                {listing.title}
              </h1>
              {ratingSummary && ratingSummary.count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StarRating value={ratingSummary.avg} showCount count={ratingSummary.count} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ratingSummary.avg.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, marginBottom: 16 }}>{t('description')}</h2>
              <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{listing.description}</div>
            </div>

            {/* Variants / Specifications */}
            {listing.variants && listing.variants.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, marginBottom: 16 }}>{t('specifications')}</h2>
                <div className="variants-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  {listing.variants.map((v) => {
                    const display = v.value === 'true' ? 'Sí' : v.value === 'false' ? 'No' : v.value;
                    return (
                      <div key={v.id} style={{ padding: '14px 18px', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{v.categoryVariantKey.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{display}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rating widget — interactive, client component */}
            <div style={{ marginBottom: 40 }}>
              <ContactButton listingId={listing.id} type="rating" listingUserId={listing.userId} initialAvg={ratingSummary?.avg ?? 0} initialCount={ratingSummary?.count ?? 0} />
            </div>

            {/* Comments — client component so new comments refresh without page reload */}
            <CommentsSection listingId={listing.id} listingUserId={listing.userId} locale={locale} />
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="detail-sidebar" style={{ position: 'sticky', top: 84 }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 24px', marginBottom: 16 }}>
              <div style={{ marginBottom: 20 }}>
                <p className="price-tag" style={{ fontSize: '2rem' }}>{formatPrice(listing.price)}</p>
                <div style={{ marginTop: 8 }}>
                  <span className={`status-badge status-${listing.status}`}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {t(statusLabelKey)}
                  </span>
                </div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: 20 }} />
              {listing.status === 'active' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <ContactButton listingId={listing.id} type="contact" listingUserId={listing.userId} />
                  <ContactButton listingId={listing.id} type="appointment" listingUserId={listing.userId} />
                  <ContactButton listingId={listing.id} type="favorite" listingUserId={listing.userId} />
                </div>
              )}
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>{t('infoTitle')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  [t('reference'), listing.code],
                  [t('location'), `${listing.location}${listing.sector ? `, ${listing.sector}` : ''}`],
                  [t('posted'), formatDate(listing.createdAt, locale)],
                  ...(listing.expiresAt ? [[t('expires'), formatDate(listing.expiresAt, locale)]] : []),
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
