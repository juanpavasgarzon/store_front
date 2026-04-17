'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebounce } from '../../lib/hooks';

export function useListingsFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const categoryId = sp.get('categoryId') ?? undefined;
  const cursor = sp.get('cursor') ?? undefined;
  const qFromUrl = sp.get('q') ?? '';
  const sortFromUrl = sp.get('sort') ?? '';
  const minPriceFromUrl = sp.get('minPrice') ?? '';
  const maxPriceFromUrl = sp.get('maxPrice') ?? '';

  const [inputValue, setInputValue] = useState(qFromUrl);
  const [minPriceInput, setMinPriceInput] = useState(minPriceFromUrl);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceFromUrl);

  const debouncedSearch = useDebounce(inputValue, 400);
  const debouncedMinPrice = useDebounce(minPriceInput, 600);
  const debouncedMaxPrice = useDebounce(maxPriceInput, 600);

  const ownNavRef = useRef(false);

  useEffect(() => {
    if (ownNavRef.current) { ownNavRef.current = false; return; }
    setInputValue(qFromUrl);
    setMinPriceInput(minPriceFromUrl);
    setMaxPriceInput(maxPriceFromUrl);
  }, [qFromUrl, minPriceFromUrl, maxPriceFromUrl]);

  const buildParams = (overrides: Record<string, string | undefined> = {}) => {
    const base: Record<string, string | undefined> = {
      categoryId, q: qFromUrl || undefined, sort: sortFromUrl || undefined,
      minPrice: minPriceFromUrl || undefined, maxPrice: maxPriceFromUrl || undefined,
      ...overrides,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(base)) { if (v) p.set(k, v); }
    return p;
  };

  const pushUrl = (overrides: Record<string, string | undefined>) => {
    ownNavRef.current = true;
    const p = buildParams(overrides);
    const qs = p.toString();
    router.replace(`/listings${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  useEffect(() => {
    if (debouncedSearch === qFromUrl) return;
    pushUrl({ q: debouncedSearch || undefined, cursor: undefined });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedMinPrice === minPriceFromUrl && debouncedMaxPrice === maxPriceFromUrl) return;
    pushUrl({ minPrice: debouncedMinPrice || undefined, maxPrice: debouncedMaxPrice || undefined, cursor: undefined });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMinPrice, debouncedMaxPrice]);

  const clearAllFilters = () => {
    ownNavRef.current = true;
    setInputValue('');
    setMinPriceInput('');
    setMaxPriceInput('');
    router.replace('/listings', { scroll: false });
  };

  const hasActiveFilters = !!(qFromUrl || sortFromUrl || minPriceFromUrl || maxPriceFromUrl || categoryId);

  return {
    // URL state
    categoryId, cursor, qFromUrl, sortFromUrl,
    minPriceNum: minPriceFromUrl ? Number(minPriceFromUrl) : undefined,
    maxPriceNum: maxPriceFromUrl ? Number(maxPriceFromUrl) : undefined,
    // Local input state
    inputValue, setInputValue,
    minPriceInput, setMinPriceInput,
    maxPriceInput, setMaxPriceInput,
    // Helpers
    hasActiveFilters, clearAllFilters,
    pushUrl, buildParams,
  };
}
