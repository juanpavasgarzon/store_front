'use client';

import Link from 'next/link';
import { usePublicListings, usePublicCategories } from '../lib/hooks';
import { useListingsFilters } from './hooks/useListingsFilters';
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
  const filters = useListingsFilters();
  const { data, isFetching } = usePublicListings({
    cursor: filters.cursor,
    q: filters.qFromUrl,
    categoryId: filters.categoryId,
    sort: filters.sortFromUrl || undefined,
    minPrice: filters.minPriceNum,
    maxPrice: filters.maxPriceNum,
  });
  const { data: catsRes } = usePublicCategories();

  const listings = data?.data ?? [];
  const meta = data?.meta;
  const cats = catsRes?.data ?? [];
  const selectedCat = cats.find((c) => c.id === filters.categoryId);

  const pageTitle = selectedCat
    ? selectedCat.name
    : filters.qFromUrl
    ? `Resultados para "${filters.qFromUrl}"`
    : 'Todos los anuncios';

  const buildHref = (extraCursor?: string | null) => {
    const p = filters.buildParams({ cursor: extraCursor ?? undefined });
    const qs = p.toString();
    return `/listings${qs ? `?${qs}` : ''}`;
  };

  const prevHref = meta?.hasPreviousPage && meta.previousCursor ? buildHref(meta.previousCursor) : null;
  const nextHref = meta?.hasNextPage && meta.nextCursor ? buildHref(meta.nextCursor) : null;

  return (
    <div className="container-wide py-12 flex-1 px-6">
      <div className="mb-10">
        <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">Mercado</p>
        <h1 className="page-heading font-light mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem' }}>
          {pageTitle}
        </h1>
        <p className="text-muted-foreground text-[14px]">
          {listings.length > 0
            ? listings.length === 1 ? '1 anuncio encontrado' : `${listings.length} anuncios encontrados`
            : null}
        </p>
      </div>

      <div className="layout-sidebar">
        {/* Sidebar */}
        <aside className="sidebar-filters">
          {filters.hasActiveFilters && (
            <div className="mb-6 pb-5 border-b border-[var(--border-light)]">
              <button
                type="button"
                onClick={filters.clearAllFilters}
                className="text-[12px] text-primary hover:text-primary/70 font-medium transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          <div className="mb-7">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">Buscar</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={filters.inputValue}
                onChange={(e) => filters.setInputValue(e.target.value)}
                placeholder="Palabras clave, atributos…"
                className="pl-9 text-[13px] h-9"
              />
            </div>
          </div>

          <div className="mb-7">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">Ordenar por</p>
            <div className="flex flex-col gap-0.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => filters.pushUrl({ sort: opt.value, cursor: undefined })}
                  className={cn(
                    'px-3 py-2 rounded-md text-[13px] text-left border transition-all duration-150',
                    filters.sortFromUrl === opt.value
                      ? 'text-foreground bg-[var(--bg-elevated)] border-[var(--border-light)]'
                      : 'text-muted-foreground bg-transparent border-transparent hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-7">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">Precio</p>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <Input
                  type="number"
                  min={0}
                  value={filters.minPriceInput}
                  onChange={(e) => filters.setMinPriceInput(e.target.value)}
                  placeholder="Mínimo"
                  className="text-[13px] h-9 w-full"
                />
                {filters.minPriceInput && Number(filters.minPriceInput) > 0 && (
                  <span className="text-[11px] text-muted-foreground pl-1">
                    $ {Number(filters.minPriceInput).toLocaleString('es-CO')}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  type="number"
                  min={0}
                  value={filters.maxPriceInput}
                  onChange={(e) => filters.setMaxPriceInput(e.target.value)}
                  placeholder="Máximo"
                  className="text-[13px] h-9 w-full"
                />
                {filters.maxPriceInput && Number(filters.maxPriceInput) > 0 && (
                  <span className="text-[11px] text-muted-foreground pl-1">
                    $ {Number(filters.maxPriceInput).toLocaleString('es-CO')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2.5">Categoría</p>
            <div className="flex flex-col gap-0.5">
              <Link
                href={filters.buildParams({ categoryId: undefined, cursor: undefined }).toString()
                  ? `/listings?${filters.buildParams({ categoryId: undefined, cursor: undefined }).toString()}`
                  : '/listings'}
                className={cn(
                  'px-3 py-2 rounded-md text-[13px] no-underline border transition-all duration-150',
                  !filters.categoryId
                    ? 'text-foreground bg-[var(--bg-elevated)] border-[var(--border-light)]'
                    : 'text-muted-foreground bg-transparent border-transparent hover:text-foreground',
                )}
              >
                Todas las categorías
              </Link>
              {cats.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/listings?${filters.buildParams({ categoryId: cat.id, cursor: undefined }).toString()}`}
                  className={cn(
                    'px-3 py-2 rounded-md text-[13px] no-underline border transition-all duration-150',
                    filters.categoryId === cat.id
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

        {/* Content */}
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
