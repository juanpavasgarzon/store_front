import { getTranslations } from 'next-intl/server';
import { Link } from '../../../i18n/navigation';
import { listings, search } from '../../lib/api';
import ListingCard from '../../components/ListingCard';
import EmptyState from '../../components/EmptyState';
import Navbar from '../../components/Navbar';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('search');
  return { title: t('titleEmpty') };
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const t = await getTranslations('search');
  const params = await searchParams;
  const q = params.q?.trim() ?? '';

  let listingResults = null;
  let categoryResults: { id: string; title: string; slug: string | null }[] = [];
  let total = 0;

  if (q) {
    const [listingsRes, searchRes] = await Promise.allSettled([
      listings.list({ search: q, limit: 24 }),
      search.query(q, 'category'),
    ]);

    if (listingsRes.status === 'fulfilled') {
      listingResults = listingsRes.value.data;
      total = listingResults.length;
    }
    if (searchRes.status === 'fulfilled') {
      categoryResults = searchRes.value.data
        .filter((r) => r.type === 'category')
        .map((r) => ({ id: r.id, title: r.title, slug: r.slug }));
      total += categoryResults.length;
    }
  }

  return (
    <>
      <Navbar />
      <div className="container-wide" style={{ padding: '56px 24px 80px', flex: 1 }}>
        {/* Header + search bar */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
            {t('eyebrow')}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 300, marginBottom: 24 }}>
            {q ? `"${q}"` : t('titleEmpty')}
          </h1>
          <form action="" method="GET" style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                name="q"
                type="text"
                defaultValue={q}
                placeholder={t('placeholder')}
                className="field"
                style={{ flex: 1, fontSize: 15 }}
                autoFocus={!q}
              />
              <button type="submit" className="btn btn-primary">{t('searchBtn')}</button>
            </div>
          </form>
        </div>

        {/* Results */}
        {q && (
          <>
            {total === 0 ? (
              <EmptyState
                icon={<Search size={32} />}
                title={t('noResults', { q })}
                subtitle={t('noResultsSub')}
                action={{ label: t('browseAll'), href: '/listings' }}
              />
            ) : (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>
                  {total === 1 ? t('resultsSingular', { count: total }) : t('resultsPlural', { count: total })}
                </p>

                {/* Listing cards grid */}
                {listingResults && listingResults.length > 0 && (
                  <section style={{ marginBottom: 48 }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400, marginBottom: 20, color: 'var(--text-muted)' }}>
                      {t('sectionListings', { count: listingResults.length })}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                      {listingResults.map((listing, i) => (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          className="animate-fade-up"
                          style={{ animationDelay: `${i * 40}ms` }}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Category pills */}
                {categoryResults.length > 0 && (
                  <section>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 400, marginBottom: 16, color: 'var(--text-muted)' }}>
                      {t('sectionCategories', { count: categoryResults.length })}
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {categoryResults.map((item) => (
                        <Link
                          key={item.id}
                          href={`/listings?categoryId=${item.id}`}
                          style={{
                            padding: '10px 18px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-accent)',
                            borderRadius: 999,
                            textDecoration: 'none',
                            fontSize: 13,
                            color: 'var(--accent)',
                            transition: 'all 0.2s',
                          }}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {!q && (
          <EmptyState
            icon={<Search size={32} />}
            title={t('hint')}
            action={{ label: t('browseHint'), href: '/listings' }}
          />
        )}
      </div>
    </>
  );
}
