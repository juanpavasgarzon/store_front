'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveMediaUrl } from '../lib/api';
import EmptyState from '../components/EmptyState';
import {
  ImageOff, LayoutGrid, MessageSquare, Heart,
  Eye, Calendar, Mail, Shield, Hash,
  ChevronUp, ChevronDown, X, Trash2, BarChart2, ExternalLink, ArrowRight,
} from 'lucide-react';
import {
  useProfile,
  useMyListings,
  useReceivedContactRequests,
  useMyFavorites,
  useDeleteListing,
  useListingStats,
} from '../lib/hooks';
import { sileo } from 'sileo';
import type { ListingResponse, ContactRequestResponse } from '../lib/types';
import CategoriesAdmin from '../admin/categories/CategoriesAdmin';
import UsersAdmin from '../admin/users/UsersAdmin';
import ReportsAdmin from '../admin/reports/ReportsAdmin';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'listings' | 'messages' | 'admin-categories' | 'admin-users' | 'admin-reports';

interface MeProfileResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  city: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

function MetricCard({ icon, value, label, sub, accent, action }: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  sub?: { text: string; color?: string }[];
  accent?: string;
  action?: { label: string; href: string };
}) {
  return (
    <Card className="relative overflow-hidden flex flex-col min-h-[180px] w-full flex-[1_1_160px] sm:flex-[1_1_220px] max-w-[300px]">
      <CardContent className="pt-8 px-7 pb-7 flex flex-col h-full">
        {/* decorative glow */}
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
        {sub && sub.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-auto">
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
          <Link
            href={action.href}
            className="mt-5 text-[12px] font-medium tracking-[0.04em] no-underline inline-flex items-center gap-1"
            style={{ color: accent ?? 'var(--accent)' }}
          >
            {action.label} <ArrowRight size={13} />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

const statusColor: Record<string, string> = {
  active:    '#5CC28A',
  reserved:  '#D49030',
  sold:      '#CC5252',
  draft:     '#6E8CB8',
  expired:   '#8A8A8A',
  suspended: '#A868A0',
};

function ListingStatsRow({ listing }: { listing: ListingResponse }) {
  const [expanded, setExpanded] = useState(false);
  const { data: stats, isLoading } = useListingStats(listing.id, expanded);
  const deleteListing = useDeleteListing();
  const photo = listing.photos?.[0];

  return (
    <Card className="overflow-hidden transition-colors duration-200">
      <div className="flex items-center gap-4 px-5 py-4 flex-wrap">
        <div className="w-16 h-12 rounded-md overflow-hidden bg-[var(--bg-elevated)] shrink-0">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(photo.thumbnailUrl ?? photo.url)}
              alt=""
              width={64}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageOff size={18} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium text-foreground truncate mb-0.5">
            {listing.title}
          </p>
          <div className="flex gap-2.5 items-center flex-wrap">
            <span className="text-[13px] text-primary font-medium">{formatPrice(listing.price)}</span>
            <span
              className="text-[10px] font-semibold tracking-[0.08em] uppercase"
              style={{ color: statusColor[listing.status] ?? 'var(--text-muted)' }}
            >
              {listing.status}
            </span>
            <span className="text-[11px] text-muted-foreground">{formatDate(listing.createdAt)}</span>
          </div>
        </div>

        <div className="flex gap-1.5 items-center shrink-0">
          <Link href={`/listings/${listing.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'xs' }))}>
            <ExternalLink size={12} /> Ver
          </Link>
          <Button
            variant={expanded ? 'secondary' : 'outline'}
            size="xs"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1"
          >
            <BarChart2 size={12} />
            Stats
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              sileo.action({
                title: '¿Eliminar este anuncio?',
                description: 'Esta acción no se puede deshacer.',
                button: { title: 'Eliminar', onClick: () => deleteListing.mutate(listing.id) },
              });
            }}
            disabled={deleteListing.isPending}
            className="text-[#CC6E6E] hover:text-[#CC6E6E] hover:bg-[color-mix(in_srgb,#CC6E6E_10%,transparent)]"
          >
            {deleteListing.isPending ? <X size={12} /> : <Trash2 size={12} />}
            {deleteListing.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </div>

      {expanded && (
        <>
          <Separator />
          <div className="px-5 py-3 bg-[var(--bg-elevated)]">
            {isLoading ? (
              <p className="text-[12px] text-muted-foreground">Cargando estadísticas…</p>
            ) : stats ? (
              <div className="flex flex-wrap gap-0 items-center">
                {[
                  { icon: <Eye size={11} />, label: 'Vistas', value: stats.totalViews },
                  { icon: <Calendar size={11} />, label: '7d', value: stats.viewsLast7Days },
                  { icon: <Calendar size={11} />, label: '30d', value: stats.viewsLast30Days },
                  { icon: <Heart size={11} />, label: 'Favoritos', value: stats.favoritesCount },
                  { icon: <Mail size={11} />, label: 'Solicitudes', value: stats.contactRequestsCount },
                ].map((s, i, arr) => (
                  <span key={s.label} className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                    <span className="text-muted-foreground flex items-center">{s.icon}</span>
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                    <span className="font-semibold text-foreground text-[12px]">{s.value}</span>
                    {i < arr.length - 1 && (
                      <span className="mx-2 text-border select-none">·</span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">No se pudieron cargar las estadísticas</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
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
            <Link href={`/listings/${cr.listingId}`} className={cn(buttonVariants({ variant: 'outline', size: 'xs' }))}>
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

export default function DashboardClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      p.set('tab', tab);
      window.history.replaceState({}, '', `?${p.toString()}`);
    }
  }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const typedProfile = profile as MeProfileResponse | undefined;
  const { data: listingsData, isLoading: listingsLoading } = useMyListings();
  const { data: receivedContactData, isLoading: receivedContactLoading } = useReceivedContactRequests();
  const { data: favData } = useMyFavorites();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tab = p.get('tab') as Tab | null;
    const valid: Tab[] = ['overview', 'listings', 'messages', 'admin-categories', 'admin-users', 'admin-reports'];
    if (tab && valid.includes(tab)) {
      setActiveTab(tab);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !profileLoading && !typedProfile) {
      router.push('/auth/login?redirect=/dashboard');
    }
  }, [mounted, profileLoading, typedProfile, router]);

  if (!mounted) return null;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>{'Cargando…'}</p>
      </div>
    );
  }

  if (!typedProfile) return null;

  const isAdmin = typedProfile.role === 'admin' || typedProfile.role === 'owner';

  const myListings = listingsData?.data ?? [];
  const receivedContactReqs = receivedContactData?.data ?? [];
  const favs = favData?.data ?? [];

  const activeListings = myListings.filter((l) => l.status === 'active').length;
  const draftListings = myListings.filter((l) => l.status === 'draft').length;

  const tabs: { id: Tab; label: string; icon?: React.ReactNode }[] = [
    { id: 'overview',          label: 'Resumen',    icon: <LayoutGrid size={12} /> },
    { id: 'listings',          label: 'Anuncios',   icon: <Hash size={12} /> },
    ...(isAdmin ? [
      { id: 'admin-categories' as Tab, label: 'Categorías', icon: <LayoutGrid size={12} /> },
    ] : []),
    { id: 'messages',          label: 'Mensajes',   icon: <MessageSquare size={12} /> },
    ...(isAdmin ? [
      { id: 'admin-reports' as Tab, label: 'Reportes', icon: <MessageSquare size={12} /> },
      { id: 'admin-users'    as Tab, label: 'Usuarios', icon: <Shield size={12} /> },
    ] : []),
  ];

  return (
    <div className="container-wide py-12 pb-20 flex-1 px-6">
      {/* Header */}
      <div className="dashboard-header mb-10 flex justify-between items-end">
        <div>
          <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
            {typedProfile.role.toUpperCase()}
          </p>
          <h1 className="font-light" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
            {'Bienvenido,'}{' '}
            <em className="italic" style={{ color: 'var(--accent-light)' }}>
              {typedProfile.name.split(' ')[0]}
            </em>
          </h1>
        </div>
        <Link href="/listings/new" className={cn(buttonVariants())}>
          {'+ Nuevo anuncio'}
        </Link>
      </div>

      {/* Tabs — using shadcn Tabs with scrollable list for many tabs */}
      <Tabs value={activeTab} onValueChange={(v) => switchTab(v as Tab)} className="mb-10">
        <div className="overflow-x-auto overflow-y-hidden scrollbar-none border-b border-border pb-0">
          <TabsList
            variant="line"
            className="w-auto min-w-full rounded-none bg-transparent border-0 h-auto gap-0 pb-0"
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'flex items-center gap-1.5 px-5 py-2.5 text-[15px] rounded-none whitespace-nowrap border-b-2 border-transparent',
                  'data-active:border-b-primary data-active:text-foreground',
                  'hover:text-foreground',
                )}
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Overview */}
        <TabsContent value="overview" className="pt-8">
          <div className="flex flex-wrap gap-5 justify-start mb-12">
            <MetricCard
              icon={<LayoutGrid size={22} />}
              value={myListings.length}
              label={'Mis anuncios'}
              accent="#C87D38"
              sub={[
                { text: `${activeListings} activos`, color: '#6ECC96' },
                ...(draftListings > 0 ? [{ text: `${draftListings} borradores`, color: 'var(--text-muted)' }] : []),
              ]}
              action={{ label: 'Mis anuncios', href: '#' }}
            />
            <MetricCard
              icon={<MessageSquare size={22} />}
              value={receivedContactReqs.length}
              label={'Mensajes recibidos'}
              accent="var(--text-secondary)"
              sub={receivedContactReqs.length > 0 ? [{ text: `${receivedContactReqs.length} mensajes`, color: 'var(--text-muted)' }] : []}
            />
            <MetricCard
              icon={<Heart size={22} />}
              value={favs.length}
              label={'Guardados'}
              accent="#CC6E6E"
              sub={favs.length > 0 ? [{ text: 'Anuncios guardados', color: 'var(--text-muted)' }] : []}
            />
          </div>

          {myListings.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-normal" style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>
                  {'Anuncios recientes'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => switchTab('listings')}
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
        </TabsContent>

        {/* My listings */}
        <TabsContent value="listings" className="pt-8">
          {listingsLoading ? (
            <p className="text-muted-foreground text-[13px]">{'Cargando…'}</p>
          ) : myListings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {myListings.map((l) => <ListingStatsRow key={l.id} listing={l} />)}
            </div>
          ) : (
            <EmptyState
              icon={<ImageOff size={32} />}
              title={'Sin anuncios aún'}
              action={{ label: 'Crea tu primer anuncio', href: '/listings/new' }}
            />
          )}
        </TabsContent>

        {/* Messages */}
        <TabsContent value="messages" className="pt-8">
          {receivedContactLoading ? (
            <p className="text-muted-foreground text-[13px]">{'Cargando…'}</p>
          ) : receivedContactReqs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {receivedContactReqs.map((cr) => <MessageRow key={cr.id} cr={cr} />)}
            </div>
          ) : (
            <EmptyState icon={<Mail size={28} />} title="Sin mensajes recibidos" />
          )}
        </TabsContent>

        {/* Admin tabs */}
        {isAdmin && (
          <>
            <TabsContent value="admin-categories" className="pt-8">
              <CategoriesAdmin embedded />
            </TabsContent>
            <TabsContent value="admin-users" className="pt-8">
              <UsersAdmin embedded />
            </TabsContent>
            <TabsContent value="admin-reports" className="pt-8">
              <ReportsAdmin embedded />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
