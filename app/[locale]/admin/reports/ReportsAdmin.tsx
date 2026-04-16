'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '../../../../i18n/navigation';
import { useProfile, useAdminReports, useUpdateReportStatus } from '../../../lib/hooks';
import type { ReportResponse, ReportStatus } from '../../../lib/types/reports';
import { Flag, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

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

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px', flexWrap: 'wrap' }}>
        {/* Flag icon + reason */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Flag size={16} color={STATUS_COLORS[report.status]} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              {REASON_LABELS[report.reason] ?? report.reason}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {formatDate(report.createdAt)} · Anuncio ID: {report.listingId.slice(0, 8)}…
            </p>
          </div>
        </div>

        {/* Status badge */}
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '4px 10px', borderRadius: 999,
          background: `color-mix(in srgb, ${STATUS_COLORS[report.status]} 15%, transparent)`,
          color: STATUS_COLORS[report.status],
          border: `1px solid color-mix(in srgb, ${STATUS_COLORS[report.status]} 30%, transparent)`,
          whiteSpace: 'nowrap',
        }}>
          {STATUS_LABELS[report.status]}
        </span>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          <Link
            href={`/listings/${report.listingId}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent)', textDecoration: 'none', padding: '5px 10px', border: '1px solid var(--border-accent)', borderRadius: 6 }}
          >
            <ExternalLink size={11} /> Ver anuncio
          </Link>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '5px 10px' }}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Ocultar' : 'Gestionar'}
          </button>
        </div>
      </div>

      {/* Details + status actions */}
      {open && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          {report.details && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, borderLeft: '3px solid var(--border-accent)', marginBottom: 16 }}>
              "{report.details}"
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

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (!embedded && mounted && !profileLoading && (!profile || !isAdmin)) {
      router.push('/');
    }
  }, [embedded, mounted, profileLoading, profile, isAdmin, router]);

  const { data, isLoading } = useAdminReports(cursor);
  const allReports = data?.data ?? [];
  const meta = data?.meta;

  const reports = statusFilter === 'all'
    ? allReports
    : allReports.filter((r) => r.status === statusFilter);

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
              ? <span style={{ color: 'var(--status-expired)', fontWeight: 500 }}>{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} de revisión</span>
              : 'Sin reportes pendientes'}
          </p>
        </div>
      )}

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

      {/* Reports list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 72, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', opacity: 0.5 }} />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <Flag size={44} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <p style={{ fontSize: 15 }}>
            {statusFilter === 'all' ? 'No hay reportes aún.' : `No hay reportes con estado "${STATUS_LABELS[statusFilter as ReportStatus]}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((r) => <ReportCard key={r.id} report={r} />)}
        </div>
      )}

      {/* Pagination */}
      {(meta?.hasNextPage || meta?.hasPreviousPage) && (
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
