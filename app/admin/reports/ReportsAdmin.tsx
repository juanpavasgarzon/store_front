'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfile, useAdminReports, useUpdateReportStatus, useDebounce } from '../../lib/hooks';
import type { ReportResponse, ReportStatus } from '../../lib/types/reports';
import { Flag, ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react';

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
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${open ? 'var(--border-accent)' : 'var(--border)'}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 20px', flexWrap: 'wrap' }}>
        {/* Icon + info */}
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${statusColor} 25%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Flag size={15} color={statusColor} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {REASON_LABELS[report.reason] ?? report.reason}
            </p>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '3px 8px', borderRadius: 999,
              background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
              color: statusColor,
              border: `1px solid color-mix(in srgb, ${statusColor} 30%, transparent)`,
            }}>
              {STATUS_LABELS[report.status]}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {formatDate(report.createdAt)}
            {report.details && (
              <span style={{ marginLeft: 8, color: 'var(--text-secondary)' }}>
                · &ldquo;{report.details.slice(0, 60)}{report.details.length > 60 ? '…' : ''}&rdquo;
              </span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <Link
            href={`/listings/${report.listingId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
              color: 'var(--accent)', textDecoration: 'none',
              padding: '5px 10px', border: '1px solid var(--border-accent)', borderRadius: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <ExternalLink size={11} /> Ver anuncio
          </Link>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '5px 10px', color: open ? 'var(--accent)' : 'var(--text-muted)' }}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Ocultar' : 'Gestionar'}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          {report.details && (
            <p style={{
              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
              padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8,
              borderLeft: '3px solid var(--border-accent)', marginBottom: 16,
            }}>
              &ldquo;{report.details}&rdquo;
            </p>
          )}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
              Cambiar estado
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {NEXT_STATUSES[report.status].map((s) => (
                <button
                  key={s}
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: '6px 14px', color: STATUS_COLORS[s] }}
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: report.id, status: s })}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando…</p>
      </div>
    );
  }

  if (!profile || !isAdmin) return null;

  const pendingCount = allReports.filter((r) => r.status === 'pending').length;

  const content = (
    <>
      {!embedded && (
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
            ADMINISTRACIÓN
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 300, marginBottom: 8 }}>
            Reportes de <em style={{ fontStyle: 'italic', color: 'var(--accent-light)' }}>anuncios</em>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {pendingCount > 0
              ? <span style={{ color: '#CC9E6E', fontWeight: 500 }}>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} de revisión</span>
              : 'Sin reportes pendientes'}
          </p>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <Search size={15} />
        </span>
        <input
          type="search"
          className="field"
          placeholder="Buscar por motivo o detalle…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ paddingLeft: 36, fontSize: 13 }}
        />
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['all', 'pending', 'reviewed', 'dismissed', 'action_taken'] as const).map((s) => {
          const active = statusFilter === s;
          const count = s === 'all' ? allReports.length : allReports.filter((r) => r.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: active ? '1px solid var(--accent-dim)' : '1px solid var(--border-light)',
                background: active ? 'var(--bg-elevated)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 72, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Flag size={44} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 15 }}>
            {searchInput
              ? 'Sin resultados para esta búsqueda.'
              : statusFilter === 'all'
                ? 'No hay reportes aún.'
                : `No hay reportes con estado "${STATUS_LABELS[statusFilter as ReportStatus]}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((r) => <ReportCard key={r.id} report={r} />)}
        </div>
      )}

      {/* Pagination — only show when no local filters applied */}
      {!searchInput && statusFilter === 'all' && (meta?.hasNextPage || meta?.hasPreviousPage) && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 32, justifyContent: 'center' }}>
          <button
            className="btn btn-outline"
            disabled={!meta.hasPreviousPage}
            onClick={() => setCursor(meta.previousCursor ?? undefined)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <ChevronLeft size={15} /> Anterior
          </button>
          <button
            className="btn btn-outline"
            disabled={!meta.hasNextPage}
            onClick={() => setCursor(meta.nextCursor ?? undefined)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            Siguiente <ChevronRight size={15} />
          </button>
        </div>
      )}
    </>
  );

  return embedded ? content : (
    <div className="container-wide" style={{ padding: '48px 24px 80px', flex: 1 }}>
      {content}
    </div>
  );
}
