import Link from 'next/link';
import { listings, search } from '../lib/api';
import ListingCard from '../components/ListingCard';
import EmptyState from '../components/EmptyState';
import Navbar from '../components/Navbar';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Encuentra cualquier cosa' };
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
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
      <div className="container-wide py-14 pb-20 flex-1 px-6">
        {/* Header + search bar */}
        <div className="mb-10 text-center">
          <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
            Búsqueda
          </p>
          <h1 className="font-light mb-6" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
            {q ? `"${q}"` : 'Encuentra cualquier cosa'}
          </h1>
          <form action="" method="GET" className="max-w-[560px] mx-auto w-full">
            <div className="flex gap-2">
              <Input
                name="q"
                type="text"
                defaultValue={q}
                placeholder="Buscar anuncios, categorías…"
                className="flex-1 text-[15px] h-11"
                autoFocus={!q}
              />
              <Button type="submit" className="h-11 px-5">Buscar</Button>
            </div>
          </form>
        </div>

        {/* Results */}
        {q && (
          <>
            {total === 0 ? (
              <EmptyState
                icon={<Search size={32} />}
                title={`Sin resultados para "${q}"`}
                subtitle="Prueba con otras palabras o explora categorías"
                action={{ label: 'Ver todos los anuncios', href: '/listings' }}
              />
            ) : (
              <div>
                <p className="text-[13px] text-muted-foreground mb-8">
                  {total === 1 ? `${total} resultado` : `${total} resultados`}
                </p>

                {listingResults && listingResults.length > 0 && (
                  <section className="mb-12">
                    <h2 className="font-light mb-5" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                      Anuncios ({listingResults.length})
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
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

                {categoryResults.length > 0 && (
                  <section>
                    <h2 className="font-light mb-4" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                      Categorías ({categoryResults.length})
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {categoryResults.map((item) => (
                        <Link
                          key={item.id}
                          href={`/listings?categoryId=${item.id}`}
                          className={cn(
                            'px-[18px] py-2.5 rounded-full text-[13px] no-underline border transition-all duration-150',
                            'bg-card border-[var(--border-accent)] text-primary hover:bg-[var(--bg-elevated)]',
                          )}
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
            title="Escribe un término para encontrar anuncios y categorías."
            action={{ label: 'Ver todos los anuncios', href: '/listings' }}
          />
        )}
      </div>
    </>
  );
}
