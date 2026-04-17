'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUpdateReportStatus } from '../../../lib/hooks';
import type { ReportResponse, ReportStatus } from '../../../lib/types/reports';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Flag, ExternalLink } from 'lucide-react';

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

export const REASON_LABELS: Record<string, string> = {
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

export function ReportCard({ report }: { report: ReportResponse }) {
  const updateStatus = useUpdateReportStatus();
  const [open, setOpen] = useState(false);
  const statusColor = STATUS_COLORS[report.status];

  return (
    <Card className={cn('overflow-hidden transition-colors duration-150', open && 'border-[var(--border-accent)]')}>
      <div className="flex items-start gap-4 px-5 py-[18px] flex-wrap">
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

        <div className="flex gap-2 items-center shrink-0">
          <Link
            href={`/listings/${report.listing?.id ?? report.listingId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <ExternalLink size={11} /> Ver anuncio
          </Link>
          <Button
            variant="ghost"
            size="sm"
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
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-2.5">
              Cambiar estado
            </p>
            <div className="flex gap-2 flex-wrap">
              {NEXT_STATUSES[report.status].map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: report.id, status: s })}
                  style={{ color: STATUS_COLORS[s] }}
                >
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
