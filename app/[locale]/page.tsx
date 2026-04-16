import { getTranslations } from 'next-intl/server';
import { Link } from '../../i18n/navigation';
import { listings, categories, legal } from '../lib/api';
import type { ListingResponse, CategoryResponse, LegalDocument } from '../lib/types';
import ListingCard from '../components/ListingCard';
import Navbar from '../components/Navbar';

async function getHomeData(): Promise<{
  trending: ListingResponse[];
  recent: ListingResponse[];
  cats: CategoryResponse[];
  listingCount: number;
  legalDocs: LegalDocument[];
}> {
  const [trendingRes, recentRes, catsRes, countRes, legalRes] = await Promise.allSettled([
    listings.trending('7d', 6),
    listings.list({ limit: 8 }),
    categories.listPublic(undefined, 12),
    listings.count(),
    legal.list(),
  ]);
  return {
    trending: trendingRes.status === 'fulfilled' ? trendingRes.value : [],
    recent: recentRes.status === 'fulfilled' ? recentRes.value.data : [],
    cats: catsRes.status === 'fulfilled' ? catsRes.value.data : [],
    listingCount: countRes.status === 'fulfilled' ? countRes.value.count : 0,
    legalDocs: legalRes.status === 'fulfilled' ? legalRes.value : [],
  };
}

export default async function HomePage() {
  const t = await getTranslations('home');
  const tf = await getTranslations('footer');
  const { trending, recent, cats, listingCount, legalDocs } = await getHomeData();

  return (
    <>
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero-section" style={{ position: 'relative', minHeight: '80vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 80% 60% at 60% 40%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%),
            radial-gradient(ellipse 40% 80% at 10% 80%, color-mix(in srgb, var(--accent) 4%, transparent) 0%, transparent 60%)
          `,
        }} />
        <div style={{ position: 'absolute', right: 0, top: 0, width: '45%', height: '100%', overflow: 'hidden', pointerEvents: 'none', opacity: 0.12 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', left: `${i * 8}%`, top: 0, bottom: 0, width: 1, background: 'var(--accent)', opacity: 1 - i * 0.07 }} />
          ))}
        </div>

        <div className="container-wide" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 680 }}>
            <p className="animate-fade-up" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--accent)' }} />
              {t('eyebrow')}
            </p>

            <h1 className="animate-fade-up delay-100 hero-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 7vw, 5.5rem)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 28 }}>
              {t('headline1')}
              <br />
              <em style={{ fontStyle: 'italic', color: 'var(--accent-light)' }}>{t('headlineAccent')}</em>{' '}
              {t('headline2')}
            </h1>

            <p className="animate-fade-up delay-200" style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 40, maxWidth: 480 }}>
              {t('subtext')}
            </p>

            <form className="animate-fade-up delay-300" action="/search" method="GET" style={{ display: 'flex', gap: 8, maxWidth: 540 }}>
              <input name="q" type="text" placeholder={t('searchPlaceholder')} className="field" style={{ flex: 1, fontSize: 14 }} />
              <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>{t('searchBtn')}</button>
            </form>
            <div className="animate-fade-up delay-400" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Link href="/listings" className="btn btn-outline" style={{ fontSize: 13 }}>{t('allListings')}</Link>
            </div>

            <div className="animate-fade-up delay-400" style={{ display: 'flex', gap: 36, marginTop: 48 }}>
              {([
                { value: listingCount > 0 ? (listingCount >= 1000 ? `${(listingCount / 1000).toFixed(1)}k+` : String(listingCount)) : '—', key: 'statsListings' },
                { value: String(cats.length || '—'), key: 'statsCategories' },
                { value: '100%', key: 'statsSecure' },
              ] as const).map(({ value, key }) => (
                <div key={key}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{t(key)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending ──────────────────────────────────────────────────────── */}
      {trending.length > 0 && (
        <section style={{ padding: '48px 0' }}>
          <div className="container-wide">
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400 }}>{t('trendingTitle')}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{t('trendingSubtitle')}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {trending.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Recent ────────────────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section style={{ padding: '48px 0 80px' }}>
          <div className="container-wide">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, marginBottom: 32 }}>{t('recentTitle')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {recent.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Empty ─────────────────────────────────────────────────────────── */}
      {trending.length === 0 && recent.length === 0 && (
        <section style={{ padding: '120px 0', textAlign: 'center' }}>
          <div className="container-narrow">
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--text-muted)', marginBottom: 16 }}>◇</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, marginBottom: 12 }}>{t('emptyTitle')}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>{t('emptyText')}</p>
            <Link href="/auth/register" className="btn btn-primary">{t('emptyCta')}</Link>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '48px 0 32px', marginTop: 'auto' }}>
        <div className="container-wide">
          {/* Top row */}
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', marginBottom: 40, justifyContent: 'space-between' }}>
            {/* Brand + description */}
            <div style={{ maxWidth: 320 }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 12 }}>
                <span style={{ color: 'var(--accent)' }}>◆</span> Tienda
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                Plataforma de compra y venta segura. Conectamos compradores y vendedores con transparencia, confianza y facilidad.
              </p>
            </div>

            {/* Legal links */}
            {legalDocs.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Legal
                </p>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {legalDocs.map((doc) => (
                    <Link
                      key={doc.slug}
                      href={`/legal/${doc.slug}`}
                      style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                    >
                      {doc.title}
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {/* Browse links */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
                Explorar
              </p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/listings" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Ver anuncios</Link>
                <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Mi panel</Link>
                <Link href="/auth/register" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}>Crear cuenta</Link>
              </nav>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {tf('rights', { year: new Date().getFullYear() })}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Hecho con cuidado para la comunidad
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
