import Link from 'next/link';
import { listings, categories } from '../lib/api';
import ListingCard from '../components/ListingCard';
import EmptyState from '../components/EmptyState';
import Navbar from '../components/Navbar';
import { LayoutGrid } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Todos los anuncios' };

interface SearchParams {
  cursor?: string;
  prevCursor?: string;
  categoryId?: string;
  q?: string;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const cursor = params.cursor;
  const categoryId = params.categoryId;
  const q = params.q;

  const [listingsRes, catsRes] = await Promise.allSettled([
    categoryId
      ? listings.listByCategory(categoryId, { cursor, limit: 12, ...(q ? { search: q } : {}) })
      : listings.list({ cursor, limit: 12, ...(q ? { search: q } : {}) }),
    categories.listPublic(undefined, 50),
  ]);

  const data = listingsRes.status === 'fulfilled'
    ? listingsRes.value
    : { data: [], meta: { hasNextPage: false, hasPreviousPage: false, nextCursor: null, previousCursor: null, limit: 12 } };
  const cats = catsRes.status === 'fulfilled' ? catsRes.value.data : [];
  const selectedCat = cats.find((c) => c.id === categoryId);

  const pageTitle = selectedCat
    ? selectedCat.name
    : q
    ? `Resultados para "${q}"`
    : 'Todos los anuncios';

  const baseHref = (extraCursor?: string | null) => {
    const p = new URLSearchParams();
    if (categoryId) { p.set('categoryId', categoryId); }
    if (q) { p.set('q', q); }
    if (extraCursor) { p.set('cursor', extraCursor); }
    const qs = p.toString();
    return `/listings${qs ? `?${qs}` : ''}`;
  };

  const prevHref = data.meta.hasPreviousPage && data.meta.previousCursor
    ? baseHref(data.meta.previousCursor)
    : null;
  const nextHref = data.meta.hasNextPage && data.meta.nextCursor
    ? baseHref(data.meta.nextCursor)
    : null;

  return (
    <>
      <Navbar />

      <div className="container-wide" style={{ padding: '48px 24px', flex: 1 }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
            Mercado
          </p>
          <h1 className="page-heading" style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 300, marginBottom: 12 }}>
            {pageTitle}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {data.data.length > 0
              ? (data.data.length === 1 ? `${data.data.length} anuncio encontrado` : `${data.data.length} anuncios encontrados`)
              : null}
          </p>
        </div>

        <div className="layout-sidebar">
          <aside className="sidebar-filters">
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                Buscar
              </p>
              <form action="" method="GET">
                {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
                <input name="q" type="text" defaultValue={q ?? ''} placeholder="Palabras clave…" className="field" style={{ fontSize: 13 }} />
              </form>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                Categoría
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Link
                  href="/listings"
                  style={{
                    padding: '8px 12px', borderRadius: 6, fontSize: 13, textDecoration: 'none',
                    color: !categoryId ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: !categoryId ? 'var(--bg-elevated)' : 'transparent',
                    border: `1px solid ${!categoryId ? 'var(--border-light)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  Todas las categorías
                </Link>
                {cats.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/listings?categoryId=${cat.id}${q ? `&q=${q}` : ''}`}
                    style={{
                      padding: '8px 12px', borderRadius: 6, fontSize: 13, textDecoration: 'none',
                      color: categoryId === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: categoryId === cat.id ? 'var(--bg-elevated)' : 'transparent',
                      border: `1px solid ${categoryId === cat.id ? 'var(--border-accent)' : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <div className="sidebar-content-divider">
            {data.data.length > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
                  {data.data.map((listing, i) => (
                    <ListingCard key={listing.id} listing={listing} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }} />
                  ))}
                </div>

                {(prevHref || nextHref) && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    {prevHref ? (
                      <Link href={prevHref} className="btn btn-outline" style={{ padding: '8px 20px', fontSize: 13 }}>
                        ← Anterior
                      </Link>
                    ) : (
                      <span />
                    )}
                    {nextHref && (
                      <Link href={nextHref} className="btn btn-outline" style={{ padding: '8px 20px', fontSize: 13 }}>
                        Siguiente →
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={<LayoutGrid size={32} />}
                title="No se encontraron anuncios"
                subtitle="Prueba con otra categoría o término de búsqueda"
                action={{ label: 'Todas las categorías', href: '/listings' }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
