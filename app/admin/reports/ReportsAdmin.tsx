'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfile, useAdminReports, useUpdateReportStatus, useDebounce } from '../../lib/hooks';
import type { ReportResponse, ReportStatus } from '../../lib/types/reports';
import { Flag, ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  dismissed: 'Descartado',
  action_taken: 'Acción tomada',
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: '#CC9E6E',
  reviewed: '#9A8C7C',
  dismissed: '#9A8C7C',
  action_taken: '#6ECC96',
};

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  fraud: 'Fraude',
  inappropriate: 'Contenido inapropiado',
  duplicate: 'Duplicado',
  wrong_category: 'Categoría incorrecta',
  other: 'Otro',
};

const NEXT_STATUSES: Record<ReportStatus, ReportStatus[]> = {
  pending: ['reviewed', 'dismissed', 'action_taken'],
  reviewed: ['dismissed', 'action_taken'],
  dismissed: ['reviewed', 'action_taken'],
  action_taken: ['reviewed', 'dismissed'],
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ReportCard({ report }: { report: ReportResponse }) {
  const updateStatus = useUpdateReportStatus();
  const [open, setOpen] = useState(false);
  const statusColor = STATUS_COLORS[report.status];

  return (
    <Card className={cn('overflow-hidden transition-colors duration-150', open && 'border-[var(--border-accent)]')}>
      <div className="flex items-start gap-4 px-5 py-[18px] flex-wrap">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center border"
          style={{
            background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
            borderColor: `color-mix(in srgb, ${statusColor} 25%, transparent)`,
          }}
        >
          <Flag size={15} color={statusColor} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-[13px] font-semibold text-foreground">
              {REASON_LABELS[report.reason] ?? report.reason}
            </p>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold tracking-[0.08em] uppercase"
              style={{
                background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
                color: statusColor,
                borderColor: `color-mix(in srgb, ${statusColor} 30%, transparent)`,
              }}
            >
              {STATUS_LABELS[report.status]}
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground">
            {formatDate(report.createdAt)}
            {report.details && (
              <span className="ml-2 text-muted-foreground">
                · &ldquo;{report.details.slice(0, 60)}{report.details.length > 60 ? '…' : ''}&rdquo;
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center shrink-0">
          <Link
            href={`/listings/${report.listingId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'xs' }))}
          >
            <ExternalLink size={11} /> Ver anuncio
          </Link>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setOpen(!open)}
            className={cn('text-[11px]', open ? 'text-primary' : 'text-muted-foreground')}
          >
            {open ? 'Ocultar' : 'Gestionar'}
          </Button>
        </div>
      </div>

      {open && (
        <>
          <Separator />
          <div className="px-5 py-4 bg-[var(--bg-elevated)]">
            {report.details && (
              <p
                className="text-[13px] text-muted-foreground leading-relaxed px-3.5 py-2.5 bg-card rounded-lg mb-4 border-l-[3px]"
                style={{ borderLeftColor: 'var(--border-accent)' }}
              >
                &ldquo;{report.details}&rdquo;
              </p>
            )}
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-2.5">
                Cambiar estado
              </p>
              <div className="flex gap-2 flex-wrap">
                {NEXT_STATUSES[report.status].map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="xs"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: report.id, status: s })}
                    style={{ color: STATUS_COLORS[s] }}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

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
          <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
            ADMINISTRACIÓN
          </p>
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

      {/* Search */}
      <div className="relative max-w-[360px] mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar por motivo o detalle…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 text-[13px] h-9"
        />
      </div>

      {/* Status filter pills */}
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

      {/* List */}
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

      {/* Pagination */}
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
    <div className="container-wide py-12 pb-20 flex-1 px-6">
      {content}
    </div>
  );
}
