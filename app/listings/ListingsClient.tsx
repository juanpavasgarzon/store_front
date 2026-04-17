'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePublicListings, usePublicCategories, useDebounce } from '../lib/hooks';
import ListingCard from '../components/ListingCard';
import EmptyState from '../components/EmptyState';
import { LayoutGrid, ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function ListingsClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const categoryId = sp.get('categoryId') ?? undefined;
  const cursor = sp.get('cursor') ?? undefined;
  const qFromUrl = sp.get('q') ?? '';

  // Local controlled input — follows URL on external nav, drives debounced URL update on typing
  const [inputValue, setInputValue] = useState(qFromUrl);
  const debouncedSearch = useDebounce(inputValue, 400);

  // Track whether the last URL-change was from us (to avoid syncing back to input)
  const ownNavRef = useRef(false);

  // Sync input when URL changes externally (e.g., category link click resets q)
  useEffect(() => {
    if (ownNavRef.current) {
      ownNavRef.current = false;
      return;
    }
    setInputValue(qFromUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qFromUrl]);

  // Push debounced search to URL (without full reload, scroll preserved)
  useEffect(() => {
    if (debouncedSearch === qFromUrl) return;
    ownNavRef.current = true;
    const p = new URLSearchParams();
    if (categoryId) p.set('categoryId', categoryId);
    if (debouncedSearch) p.set('q', debouncedSearch);
    // reset cursor on new search
    const qs = p.toString();
    router.replace(`/listings${qs ? `?${qs}` : ''}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data, isFetching } = usePublicListings({ cursor, q: qFromUrl, categoryId });
  const { data: catsRes } = usePublicCategories();

  const listings = data?.data ?? [];
  const meta = data?.meta;
  const cats = catsRes?.data ?? [];
  const selectedCat = cats.find((c) => c.id === categoryId);

  const pageTitle = selectedCat
    ? selectedCat.name
    : qFromUrl
    ? `Resultados para "${qFromUrl}"`
    : 'Todos los anuncios';

  const baseHref = (extraCursor?: string | null) => {
    const p = new URLSearchParams();
    if (categoryId) p.set('categoryId', categoryId);
    if (qFromUrl) p.set('q', qFromUrl);
    if (extraCursor) p.set('cursor', extraCursor);
    const qs = p.toString();
    return `/listings${qs ? `?${qs}` : ''}`;
  };

  const prevHref = meta?.hasPreviousPage && meta.previousCursor ? baseHref(meta.previousCursor) : null;
  const nextHref = meta?.hasNextPage && meta.nextCursor ? baseHref(meta.nextCursor) : null;

  return (
    <div className="container-wide py-12 flex-1 px-6">
      <div className="mb-10">
        <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
          Mercado
        </p>
        <h1
          className="page-heading font-light mb-3"
          style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem' }}
        >
          {pageTitle}
        </h1>
        <p className="text-muted-foreground text-[14px]">
          {listings.length > 0
            ? listings.length === 1
              ? '1 anuncio encontrado'
              : `${listings.length} anuncios encontrados`
            : null}
        </p>
      </div>

      <div className="layout-sidebar">
        {/* ── Sidebar ── */}
        <aside className="sidebar-filters">
          <div className="mb-7">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">
              Buscar
            </p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Palabras clave, categoría…"
                className="pl-9 text-[13px] h-9"
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">
              Categoría
            </p>
            <div className="flex flex-col gap-0.5">
              <Link
                href={qFromUrl ? `/listings?q=${encodeURIComponent(qFromUrl)}` : '/listings'}
                className={cn(
                  'px-3 py-2 rounded-md text-[13px] no-underline border transition-all duration-150',
                  !categoryId
                    ? 'text-foreground bg-[var(--bg-elevated)] border-[var(--border-light)]'
                    : 'text-muted-foreground bg-transparent border-transparent hover:text-foreground',
                )}
              >
                Todas las categorías
              </Link>
              {cats.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/listings?categoryId=${cat.id}${qFromUrl ? `&q=${encodeURIComponent(qFromUrl)}` : ''}`}
                  className={cn(
                    'px-3 py-2 rounded-md text-[13px] no-underline border transition-all duration-150',
                    categoryId === cat.id
                      ? 'text-foreground bg-[var(--bg-elevated)] border-[var(--border-accent)]'
                      : 'text-muted-foreground bg-transparent border-transparent hover:text-foreground',
                  )}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <div
          className="sidebar-content-divider"
          style={{ opacity: isFetching ? 0.55 : 1, transition: 'opacity 0.18s ease' }}
        >
          {listings.length > 0 ? (
            <>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-4 mb-10">
                {listings.map((listing, i) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    className="animate-fade-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>

              {(prevHref || nextHref) && (
                <div className="flex justify-center gap-3">
                  {prevHref ? (
                    <Link href={prevHref} className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex items-center gap-1.5')}>
                      <ArrowLeft size={14} /> Anterior
                    </Link>
                  ) : <span />}
                  {nextHref && (
                    <Link href={nextHref} className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex items-center gap-1.5')}>
                      Siguiente <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : !isFetching ? (
            <EmptyState
              icon={<LayoutGrid size={32} />}
              title="No se encontraron anuncios"
              subtitle="Prueba con otra categoría o término de búsqueda"
              action={{ label: 'Todas las categorías', href: '/listings' }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
