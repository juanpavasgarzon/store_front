'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveMediaUrl } from '../lib/api';
import EmptyState from '../components/EmptyState';
import {
  ImageOff, LayoutGrid, MessageSquare, Heart,
  Eye, Calendar, Mail, Shield, Hash,
  ChevronUp, ChevronDown, X, Trash2, BarChart2, ExternalLink, ArrowRight,
  ChevronLeft, ChevronRight,
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

type Tab = 'overview' | 'listings' | 'messages' | 'admin-categories' | 'admin-users' | 'admin-reports';

interface MeProfileResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

function MetricCard({ icon, value, label, sub, accent, action }: {
  icon: React.ReactNode; value: number | string; label: string;
  sub?: { text: string; color?: string }[];
  accent?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div style={{
      padding: '32px 28px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      position: 'relative',
      overflow: 'hidden',
      minHeight: 200,
      flex: '1 1 220px',
      maxWidth: 300,
    }}>
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 140, height: 140, borderRadius: '50%',
        background: `color-mix(in srgb, ${accent ?? 'var(--accent)'} 8%, transparent)`,
        pointerEvents: 'none',
      }} />
      <span style={{ color: accent ?? 'var(--accent)', marginBottom: 16, display: 'block' }}>{icon}</span>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: '3.2rem',
        fontWeight: 300, lineHeight: 1, color: 'var(--text-primary)', marginBottom: 8,
      }}>{value}</p>
      <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>{label}</p>
      {sub && sub.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 'auto' }}>
          {sub.map((s, i) => (
            <span key={i} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 999,
              background: 'var(--bg-elevated)',
              color: s.color ?? 'var(--text-muted)',
              border: '1px solid var(--border-light)',
            }}>{s.text}</span>
          ))}
        </div>
      )}
      {action && (
        <Link href={action.href} style={{
          marginTop: 20, fontSize: 12, color: accent ?? 'var(--accent)',
          textDecoration: 'none', fontWeight: 500, letterSpacing: '0.04em',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {action.label} →
        </Link>
      )}
    </div>
  );
}

function ListingStatsRow({ listing }: { listing: ListingResponse }) {
  const [expanded, setExpanded] = useState(false);
  const { data: stats, isLoading } = useListingStats(listing.id, expanded);
  const deleteListing = useDeleteListing();
  const photo = listing.photos?.[0];

  const statusColor: Record<string, string> = {
    active: '#6ECC96', draft: '#9A8C7C', reserved: '#CC9E6E',
    sold: '#CC6E6E', expired: '#9A8C7C', suspended: '#8C7D6E',
  };

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', flexWrap: 'wrap' }}>
        <div style={{ width: 64, height: 48, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-elevated)', flexShrink: 0 }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(photo.thumbnailUrl ?? photo.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><ImageOff size={18} /></div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
            {listing.title}
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{formatPrice(listing.price)}</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: statusColor[listing.status] ?? 'var(--text-muted)' }}>
              {listing.status}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(listing.createdAt)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <Link
            href={`/listings/${listing.id}`}
            style={{
              fontSize: 11, color: 'var(--accent)', textDecoration: 'none',
              padding: '5px 10px', border: '1px solid var(--border-accent)', borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <ExternalLink size={12} /> Ver
          </Link>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              fontSize: 11, padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${expanded ? 'var(--accent-dim)' : 'var(--border-light)'}`,
              background: expanded ? 'var(--bg-elevated)' : 'transparent',
              color: expanded ? 'var(--accent-light)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <BarChart2 size={12} />
            Stats
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <button
            onClick={() => {
              sileo.action({
                title: '¿Eliminar este anuncio?',
                description: 'Esta acción no se puede deshacer.',
                button: { title: 'Eliminar', onClick: () => deleteListing.mutate(listing.id) },
              });
            }}
            disabled={deleteListing.isPending}
            style={{
              fontSize: 11, padding: '5px 10px', borderRadius: 6,
              border: '1px solid var(--border-light)', background: 'transparent',
              color: deleteListing.isPending ? 'var(--text-muted)' : '#CC6E6E',
              cursor: deleteListing.isPending ? 'default' : 'pointer',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
            }}
            onMouseEnter={(e) => { if (!deleteListing.isPending) (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, #CC6E6E 10%, transparent)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {deleteListing.isPending ? <X size={12} /> : <Trash2 size={12} />}
            {deleteListing.isPending ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          {isLoading ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cargando estadísticas…</p>
          ) : stats ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 0', alignItems: 'center' }}>
              {[
                { icon: <Eye size={11} />, label: 'Vistas', value: stats.totalViews },
                { icon: <Calendar size={11} />, label: '7d', value: stats.viewsLast7Days },
                { icon: <Calendar size={11} />, label: '30d', value: stats.viewsLast30Days },
                { icon: <Heart size={11} />, label: 'Favoritos', value: stats.favoritesCount },
                { icon: <Mail size={11} />, label: 'Solicitudes', value: stats.contactRequestsCount },
              ].map((s, i, arr) => (
                <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>{s.icon}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{s.value}</span>
                  {i < arr.length - 1 && (
                    <span style={{ margin: '0 8px', color: 'var(--border)', userSelect: 'none' }}>·</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No se pudieron cargar las estadísticas</p>
          )}
        </div>
      )}
    </div>
  );
}

function MessageRow({ cr }: { cr: ContactRequestResponse }) {
  const requesterName = cr.requester?.name ?? cr.requester?.email ?? 'Usuario desconocido';
  const listingTitle = cr.listing?.title ?? 'Anuncio sin título';

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              {requesterName}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {listingTitle}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(cr.createdAt)}</span>
            <Link
              href={`/listings/${cr.listingId}`}
              style={{
                fontSize: 11, color: 'var(--accent)', textDecoration: 'none',
                padding: '5px 10px', border: '1px solid var(--border-accent)', borderRadius: 6,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              <ExternalLink size={12} /> Ver anuncio
            </Link>
          </div>
        </div>
        {cr.message && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, borderLeft: '3px solid var(--border-accent)' }}>
            {cr.message}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      p.set('tab', tab);
      window.history.replaceState({}, '', `?${p.toString()}`);
    }
  };

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
    const el = tabsRef.current;
    if (!el) return;
    updateScrollState();
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    window.addEventListener('resize', updateScrollState);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  useEffect(() => {
    const id = requestAnimationFrame(updateScrollState);
    return () => cancelAnimationFrame(id);
  }, [typedProfile, updateScrollState]);

  useEffect(() => {
    if (mounted && !profileLoading && !typedProfile) {
      router.push('/auth/login?redirect=/dashboard');
    }
  }, [mounted, profileLoading, typedProfile, router]);

  if (!mounted) return null;

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
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
    { id: 'overview', label: 'Resumen', icon: <LayoutGrid size={12} /> },
    { id: 'listings', label: 'Mis anuncios', icon: <Hash size={12} /> },
    { id: 'messages', label: 'Mensajes', icon: <MessageSquare size={12} /> },
    ...(isAdmin ? [
      { id: 'admin-categories' as Tab, label: 'Categorías', icon: <LayoutGrid size={12} /> },
      { id: 'admin-users' as Tab, label: 'Usuarios', icon: <Shield size={12} /> },
      { id: 'admin-reports' as Tab, label: 'Reportes', icon: <MessageSquare size={12} /> },
    ] : []),
  ];

  return (
    <div className="container-wide" style={{ padding: '48px 24px 80px', flex: 1 }}>
      <div className="dashboard-header" style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
            {typedProfile.role.toUpperCase()}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 300 }}>
            {'Bienvenido,'} <em style={{ fontStyle: 'italic', color: 'var(--accent-light)' }}>{typedProfile.name.split(' ')[0]}</em>
          </h1>
        </div>
        <Link href="/listings/new" className="btn btn-primary">{'+ Nuevo anuncio'}</Link>
      </div>

      <div style={{ position: 'relative', marginBottom: 40 }}>
        <button
          onClick={() => scrollTabs('left')}
          disabled={!canScrollLeft}
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 1, zIndex: 10,
            width: 36, background: 'linear-gradient(to right, var(--bg-canvas) 60%, transparent)',
            border: 'none', cursor: canScrollLeft ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center',
            justifyContent: 'flex-start', padding: '0 4px',
            color: canScrollLeft ? 'var(--text-primary)' : 'var(--text-muted)',
            opacity: canScrollLeft ? 1 : 0.3,
            transition: 'opacity 0.2s, color 0.2s',
          }}
          aria-label="Desplazar tabs a la izquierda"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={tabsRef}
          onScroll={updateScrollState}
          style={{
            display: 'flex', gap: 4,
            borderBottom: '1px solid var(--border)',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch',
            alignItems: 'flex-end',
            scrollbarWidth: 'none',
            paddingLeft: 32,
            paddingRight: 32,
          }}
        >
          {tabs.map((tab) => (
            <div key={tab.id} style={{ flexShrink: 0 }}>
              <button
                onClick={() => switchTab(tab.id)}
                className="btn btn-ghost"
                style={{
                  padding: '10px 20px',
                  fontSize: 15,
                  borderRadius: '6px 6px 0 0',
                  borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => scrollTabs('right')}
          disabled={!canScrollRight}
          style={{
            position: 'absolute', right: 0, top: 0, bottom: 1, zIndex: 10,
            width: 36, background: 'linear-gradient(to left, var(--bg-canvas) 60%, transparent)',
            border: 'none', cursor: canScrollRight ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end', padding: '0 4px',
            color: canScrollRight ? 'var(--text-primary)' : 'var(--text-muted)',
            opacity: canScrollRight ? 1 : 0.3,
            transition: 'opacity 0.2s, color 0.2s',
          }}
          aria-label="Desplazar tabs a la derecha"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'flex-start', marginBottom: 48 }}>
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
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400 }}>{'Anuncios recientes'}</h2>
                <button
                  onClick={() => switchTab('listings')}
                  style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Ver todos <ArrowRight size={13} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myListings.slice(0, 3).map((l) => <ListingStatsRow key={l.id} listing={l} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'listings' && (
        <div>
          {listingsLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{'Cargando…'}</p>
          ) : myListings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myListings.map((l) => <ListingStatsRow key={l.id} listing={l} />)}
            </div>
          ) : (
            <EmptyState
              icon={<ImageOff size={32} />}
              title={'Sin anuncios aún'}
              action={{ label: 'Crea tu primer anuncio', href: '/listings/new' }}
            />
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div>
          {receivedContactLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{'Cargando…'}</p>
          ) : receivedContactReqs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {receivedContactReqs.map((cr) => <MessageRow key={cr.id} cr={cr} />)}
            </div>
          ) : (
            <EmptyState icon={<Mail size={28} />} title="Sin mensajes recibidos" />
          )}
        </div>
      )}

      {activeTab === 'admin-categories' && isAdmin && (
        <CategoriesAdmin embedded />
      )}

      {activeTab === 'admin-users' && isAdmin && (
        <UsersAdmin embedded />
      )}

      {activeTab === 'admin-reports' && isAdmin && (
        <ReportsAdmin embedded />
      )}

    </div>
  );
}
