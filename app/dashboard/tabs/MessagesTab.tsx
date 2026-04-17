'use client';

import Link from 'next/link';
import { Mail, ExternalLink } from 'lucide-react';
import { useReceivedContactRequests } from '../../lib/hooks';
import type { ContactRequestResponse } from '../../lib/types';
import EmptyState from '../../components/EmptyState';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function MessageRow({ cr }: { cr: ContactRequestResponse }) {
  const requesterName = cr.requester?.name ?? cr.requester?.email ?? 'Usuario desconocido';
  const listingTitle = cr.listing?.title ?? 'Anuncio sin título';

  return (
    <Card>
      <CardContent className="px-6 pt-5 pb-5">
        <div className="flex justify-between items-start flex-wrap gap-2 mb-2.5">
          <div>
            <p className="text-[13px] font-semibold text-foreground mb-0.5">{requesterName}</p>
            <p className="text-[12px] text-muted-foreground">{listingTitle}</p>
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <span className="text-[11px] text-muted-foreground">{formatDate(cr.createdAt)}</span>
            <Link href={`/listings/${cr.listingId}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              <ExternalLink size={12} /> Ver anuncio
            </Link>
          </div>
        </div>
        {cr.message && (
          <p
            className="text-[14px] text-muted-foreground leading-relaxed px-4 py-3 bg-[var(--bg-elevated)] rounded-lg border-l-[3px]"
            style={{ borderLeftColor: 'var(--border-accent)' }}
          >
            {cr.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MessagesTab() {
  const { data, isLoading } = useReceivedContactRequests();
  const receivedContactReqs = data?.data ?? [];

  return (
    <>
      {isLoading ? (
        <p className="text-muted-foreground text-[13px]">Cargando…</p>
      ) : receivedContactReqs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {receivedContactReqs.map((cr) => <MessageRow key={cr.id} cr={cr} />)}
        </div>
      ) : (
        <EmptyState icon={<Mail size={28} />} title="Sin mensajes recibidos" />
      )}
    </>
  );
}
