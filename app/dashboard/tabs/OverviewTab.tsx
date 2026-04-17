'use client';

import Link from 'next/link';
import { LayoutGrid, MessageSquare, Heart, ArrowRight } from 'lucide-react';
import { useMyListings, useReceivedContactRequests, useMyFavorites } from '../../lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ListingStatsRow } from './ListingsTab';

function MetricCard({ icon, value, label, sub, accent, action }: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  sub?: { text: string; color?: string }[];
  accent?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <Card className="relative overflow-hidden flex flex-col min-h-[180px] w-full flex-[1_1_160px] sm:flex-[1_1_220px] max-w-[300px]">
      <CardContent className="pt-8 px-7 pb-7 flex flex-col h-full">
        <div
          className="absolute -top-10 -right-10 w-[140px] h-[140px] rounded-full pointer-events-none"
          style={{ background: `color-mix(in srgb, ${accent ?? 'var(--accent)'} 8%, transparent)` }}
        />
        <span className="mb-4 block" style={{ color: accent ?? 'var(--accent)' }}>{icon}</span>
        <p
          className="font-light leading-none text-foreground mb-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: '3.2rem' }}
        >
          {value}
        </p>
        <p className="text-[12px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-4">
          {label}
        </p>
        <div className="flex-1" />
        {sub && sub.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {sub.map((s, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[11px] px-2.5 py-0.5 bg-[var(--bg-elevated)] border-[var(--border-light)]"
                style={{ color: s.color ?? 'var(--text-muted)' }}
              >
                {s.text}
              </Badge>
            ))}
          </div>
        )}
        {action && (
          action.onClick ? (
            <button
              onClick={action.onClick}
              className="text-[12px] font-medium tracking-[0.04em] no-underline inline-flex items-center gap-1 cursor-pointer"
              style={{ color: '#C87D38' }}
            >
              {action.label} <ArrowRight size={13} />
            </button>
          ) : (
            <Link
              href={action.href!}
              className="text-[12px] font-medium tracking-[0.04em] no-underline inline-flex items-center gap-1"
              style={{ color: '#C87D38' }}
            >
              {action.label} <ArrowRight size={13} />
            </Link>
          )
        )}
      </CardContent>
    </Card>
  );
}

export default function OverviewTab({ onSwitchTab }: { onSwitchTab: (tab: string) => void }) {
  const { data: listingsData } = useMyListings();
  const { data: receivedContactData } = useReceivedContactRequests();
  const { data: favData } = useMyFavorites();

  const myListings = listingsData?.data ?? [];
  const receivedContactReqs = receivedContactData?.data ?? [];
  const favs = favData?.data ?? [];

  const activeListings = myListings.filter((l) => l.status === 'active').length;
  const draftListings = myListings.filter((l) => l.status === 'draft').length;

  return (
    <>
      <div className="flex flex-wrap gap-5 justify-start mb-12">
        <MetricCard
          icon={<LayoutGrid size={22} />}
          value={myListings.length}
          label="Mis anuncios"
          accent="#C87D38"
          sub={[
            { text: `${activeListings} activos`, color: '#6ECC96' },
            ...(draftListings > 0 ? [{ text: `${draftListings} borradores`, color: 'var(--text-muted)' }] : []),
          ]}
          action={{ label: 'Ver anuncios', onClick: () => onSwitchTab('listings') }}
        />
        <MetricCard
          icon={<MessageSquare size={22} />}
          value={receivedContactReqs.length}
          label="Mensajes recibidos"
          accent="var(--text-secondary)"
          sub={receivedContactReqs.length > 0 ? [{ text: `${receivedContactReqs.length} mensajes`, color: 'var(--text-muted)' }] : []}
          action={{ label: 'Ver mensajes', onClick: () => onSwitchTab('messages') }}
        />
        <MetricCard
          icon={<Heart size={22} />}
          value={favs.length}
          label="Guardados"
          accent="#CC6E6E"
          sub={favs.length > 0 ? [{ text: 'Anuncios guardados', color: 'var(--text-muted)' }] : []}
          action={{ label: 'Ver guardados', href: '/favorites' }}
        />
      </div>

      {myListings.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-normal" style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>
              Anuncios recientes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSwitchTab('listings')}
              className="text-[12px] text-primary flex items-center gap-1"
            >
              Ver todos <ArrowRight size={13} />
            </Button>
          </div>
          <div className="flex flex-col gap-2.5">
            {myListings.slice(0, 3).map((l) => <ListingStatsRow key={l.id} listing={l} />)}
          </div>
        </div>
      )}
    </>
  );
}
