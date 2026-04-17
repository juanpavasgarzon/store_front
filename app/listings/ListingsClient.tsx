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

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Más recientes' },
  { value: 'price', label: 'Precio: menor a mayor' },
  { value: '-price', label: 'Precio: mayor a menor' },
] as const;

export default function ListingsClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const categoryId = sp.get('categoryId') ?? undefined;
  const cursor = sp.get('cursor') ?? undefined;
  const qFromUrl = sp.get('q') ?? '';
  const sortFromUrl = sp.get('sort') ?? '';
  const minPriceFromUrl = sp.get('minPrice') ?? '';
  const maxPriceFromUrl = sp.get('maxPrice') ?? '';

  // Local controlled inputs
  const [inputValue, setInputValue] = useState(qFromUrl);
  const [minPriceInput, setMinPriceInput] = useState(minPriceFromUrl);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceFromUrl);

  const debouncedSearch = useDebounce(inputValue, 400);
  const debouncedMinPrice = useDebounce(minPriceInput, 600);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 600);

  // Track whether the last URL-change was from us (to avoid syncing back to inputs)
  const ownNavRef = useRef(false);

  // Sync inputs when URL changes externally
  useEffect(() => {
    if (ownNavRef.current) {
      ownNavRef.current = false;
      return;
    }
    setInputValue(qFromUrl);
    setMinPriceInput(minPriceFromUrl);
    setMaxPriceInput(maxPriceFromUrl);
  }, [qFromUrl, minPriceFromUrl, maxPriceFromUrl]);

  const buildParams = (overrides: Record<string, string | undefined> = {}) => {
    const base: Record<string, string | undefined> = {
      categoryId,
      q: qFromUrl || undefined,
      sort: sortFromUrl || undefined,
      minPrice: minPriceFromUrl || undefined,
      maxPrice: maxPriceFromUrl || undefined,
      ...overrides,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(base)) {
      if (v) p.set(k, v);
    }
    return p;
  };

  const pushUrl = (overrides: Record<string, string | undefined>) => {
    ownNavRef.current = true;
    const p = buildParams(overrides);
    const qs = p.toString();
    router.replace(`/listings${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  // Push debounced search to URL
  useEffect(() => {
    if (debouncedSearch === qFromUrl) return;
    pushUrl({ q: debouncedSearch || undefined, cursor: undefined });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Push debounced price range to URL
  useEffect(() => {
    if (debouncedMinPrice === minPriceFromUrl && debouncedMaxPrice === maxPriceFromUrl) return;
    pushUrl({ minPrice: debouncedMinPrice || undefined, maxPrice: debouncedMaxPrice || undefined, cursor: undefined });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMinPrice, debouncedMaxPrice]);

  const minPriceNum = minPriceFromUrl ? Number(minPriceFromUrl) : undefined;
  const maxPriceNum = maxPriceFromUrl ? Number(maxPriceFromUrl) : undefined;

  const { data, isFetching } = usePublicListings({
    cursor,
    q: qFromUrl,
    categoryId,
    sort: sortFromUrl || undefined,
    minPrice: minPriceNum,
    maxPrice: maxPriceNum,
  });
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
    const p = buildParams({ cursor: extraCursor ?? undefined });
    const qs = p.toString();
    return `/listings${qs ? `?${qs}` : ''}`;
  };

  const prevHref = meta?.hasPreviousPage && meta.previousCursor ? baseHref(meta.previousCursor) : null;
  const nextHref = meta?.hasNextPage && meta.nextCursor ? baseHref(meta.nextCursor) : null;

  const hasActiveFilters = !!(qFromUrl || sortFromUrl || minPriceFromUrl || maxPriceFromUrl || categoryId);

  const clearAllFilters = () => {
    ownNavRef.current = true;
    setInputValue('');
    setMinPriceInput('');
    setMaxPriceInput('');
    router.replace('/listings', { scroll: false });
  };

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
          {/* Clear all filters */}
          {hasActiveFilters && (
            <div className="mb-6 pb-5 border-b border-[var(--border-light)]">
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[12px] text-primary hover:text-primary/70 font-medium transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Search */}
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
                placeholder="Palabras clave, atributos…"
                className="pl-9 text-[13px] h-9"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="mb-7">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">
              Ordenar por
            </p>
            <div className="flex flex-col gap-0.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => pushUrl({ sort: opt.value || undefined, cursor: undefined })}
                  className={cn(
                    'px-3 py-2 rounded-md text-[13px] text-left border transition-all duration-150',
                    sortFromUrl === opt.value
                      ? 'text-foreground bg-[var(--bg-elevated)] border-[var(--border-light)]'
                      : 'text-muted-foreground bg-transparent border-transparent hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="mb-7">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">
              Precio
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <Input
                  type="number"
                  min={0}
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  placeholder="Mínimo"
                  className="text-[13px] h-9 w-full"
                />
                {minPriceInput && Number(minPriceInput) > 0 && (
                  <span className="text-[11px] text-muted-foreground pl-1">
                    $ {Number(minPriceInput).toLocaleString('es-CO')}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  type="number"
                  min={0}
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  placeholder="Máximo"
                  className="text-[13px] h-9 w-full"
                />
                {maxPriceInput && Number(maxPriceInput) > 0 && (
                  <span className="text-[11px] text-muted-foreground pl-1">
                    $ {Number(maxPriceInput).toLocaleString('es-CO')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">
              Categoría
            </p>
            <div className="flex flex-col gap-0.5">
              <Link
                href={buildParams({ categoryId: undefined, cursor: undefined }).toString()
                  ? `/listings?${buildParams({ categoryId: undefined, cursor: undefined }).toString()}`
                  : '/listings'}
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
                  href={`/listings?${buildParams({ categoryId: cat.id, cursor: undefined }).toString()}`}
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
