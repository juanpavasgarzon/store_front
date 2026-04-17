'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile, useAdminReports, useDebounce } from '../../lib/hooks';
import type { ReportStatus } from '../../lib/types/reports';
import { ReportCard, REASON_LABELS } from './components/ReportCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Flag, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  dismissed: 'Descartado',
  action_taken: 'Acción tomada',
};

export default function ReportsAdmin({ embedded }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const [cursor, setCursor] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (!embedded && mounted && !profileLoading && (!profile || !isAdmin)) {
      router.push('/');
    }
  }, [embedded, mounted, profileLoading, profile, isAdmin, router]);

  const { data, isLoading } = useAdminReports(cursor);
  const allReports = data?.data ?? [];
  const meta = data?.meta;

  const filtered = allReports.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q
      || (REASON_LABELS[r.reason] ?? r.reason).toLowerCase().includes(q)
      || (r.details ?? '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  if (!embedded && !mounted) return null;

  if (!embedded && profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!profile || !isAdmin) return null;

  const pendingCount = allReports.filter((r) => r.status === 'pending').length;

  const content = (
    <>
      {!embedded && (
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">ADMINISTRACIÓN</p>
          <h1 className="font-light mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
            Reportes de <em className="italic" style={{ color: 'var(--accent-light)' }}>anuncios</em>
          </h1>
          <p className="text-muted-foreground text-[14px]">
            {pendingCount > 0
              ? <span className="font-medium" style={{ color: '#CC9E6E' }}>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} de revisión</span>
              : 'Sin reportes pendientes'}
          </p>
        </div>
      )}

      <div className="relative w-full max-w-[360px] mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar por motivo o detalle…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 text-[13px] h-9"
        />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'reviewed', 'dismissed', 'action_taken'] as const).map((s) => {
          const active = statusFilter === s;
          const count = s === 'all' ? allReports.length : allReports.filter((r) => r.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-[12px] font-medium cursor-pointer border transition-all',
                active
                  ? 'border-[var(--accent-dim)] bg-[var(--bg-elevated)] text-primary'
                  : 'border-[var(--border-light)] bg-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] bg-card rounded-xl border border-border opacity-50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-[60px] text-muted-foreground">
          <Flag size={44} className="mx-auto mb-4 block opacity-30" />
          <p className="text-[15px]">
            {searchInput
              ? 'Sin resultados para esta búsqueda.'
              : statusFilter === 'all'
                ? 'No hay reportes aún.'
                : `No hay reportes con estado "${STATUS_LABELS[statusFilter as ReportStatus]}".`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((r) => <ReportCard key={r.id} report={r} />)}
        </div>
      )}

      {!searchInput && statusFilter === 'all' && (meta?.hasNextPage || meta?.hasPreviousPage) && (
        <div className="flex gap-3 items-center mt-8 justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPreviousPage}
            onClick={() => setCursor(meta.previousCursor ?? undefined)}
            className="flex items-center gap-1.5"
          >
            <ChevronLeft size={15} /> Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNextPage}
            onClick={() => setCursor(meta.nextCursor ?? undefined)}
            className="flex items-center gap-1.5"
          >
            Siguiente <ChevronRight size={15} />
          </Button>
        </div>
      )}
    </>
  );

  return embedded ? content : (
    <div className="container-wide py-12 pb-20 flex-1 px-6">{content}</div>
  );
}
