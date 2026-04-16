'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '../../../i18n/navigation';
import { clearTokens, resolveMediaUrl, listings } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import {
  ImageOff, LayoutGrid, CalendarDays, MessageSquare, Heart,
  Eye, Calendar, Star, Mail, Shield, Hash, MapPin,
  ChevronUp, ChevronDown, X, Trash2, BarChart2, ExternalLink, CalendarX2, CheckCheck, ArrowRight,
  Save, Pencil, LogOut, Tag, Users, Flag, FileText, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';
import CategoriesAdmin from '../admin/categories/CategoriesAdmin';
import UsersAdmin from '../admin/users/UsersAdmin';
import ReportsAdmin from '../admin/reports/ReportsAdmin';
import LegalAdmin from '../admin/legal/LegalAdmin';
import ContactConfigAdmin from '../admin/contact-config/ContactConfigAdmin';
import {
  useProfile,
  useUpdateProfile,
  useMyListings,
  useMyAppointments,
  useMyContactRequests,
  useMyFavorites,
  useDeleteListing,
  useListingStats,
  useDeleteAppointment,
  useUpdateContactRequestStatus,
  useCreateAppointment,
  useMyRatings,
} from '../../lib/hooks';
import { sileo } from 'sileo';
import { useQueryClient } from '@tanstack/react-query';
import type { AppointmentStatus, ContactRequestStatus, ListingResponse, AppointmentResponse, ContactRequestResponse } from '../../lib/types';
import StarRating from '../../components/StarRating';

type Tab = 'overview' | 'listings' | 'appointments' | 'contact-requests' | 'ratings' | 'profile'
  | 'admin-categories' | 'admin-users' | 'admin-reports' | 'admin-legal' | 'admin-contact';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

const apptColors: Record<AppointmentStatus, string> = {
  pending: '#CC9E6E', confirmed: '#6ECC96', cancelled: '#CC6E6E', completed: '#9A8C7C',
};
const contactColors: Record<ContactRequestStatus, string> = {
  pending: '#CC9E6E', responded: '#6ECC96', closed: '#9A8C7C',
};

// ─── Big metric card ──────────────────────────────────────────────────────────
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
      {/* Background accent glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 140, height: 140, borderRadius: '50%',
        background: `color-mix(in srgb, ${accent ?? 'var(--accent)'} 8%, transparent)`,
        pointerEvents: 'none',
      }} />
      {/* Icon */}
      <span style={{ color: accent ?? 'var(--accent)', marginBottom: 16, display: 'block' }}>{icon}</span>
      {/* Value */}
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: '3.2rem',
        fontWeight: 300, lineHeight: 1, color: 'var(--text-primary)', marginBottom: 8,
      }}>{value}</p>
      {/* Label */}
      <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>{label}</p>
      {/* Sub stats */}
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
      {/* Action link */}
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

// ─── Listing stat row (lazy loads stats) ─────────────────────────────────────
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
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', flexWrap: 'wrap' }}>
        {/* Thumbnail */}
        <div style={{ width: 64, height: 48, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-elevated)', flexShrink: 0 }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(photo.thumbnailUrl ?? photo.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><ImageOff size={18} /></div>
          )}
        </div>

        {/* Info */}
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

        {/* Actions */}
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

      {/* Expanded stats */}
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
                { icon: <Star size={11} />, label: 'Rating', value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—' },
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

// ─── Appointment row (needs own component to call hook) ───────────────────────
function AppointmentRow({ appt }: { appt: AppointmentResponse }) {
  const deleteAppt = useDeleteAppointment(appt.listingId);
  const canCancel = appt.status === 'pending' || appt.status === 'confirmed';
  const photo = appt.listing?.photos?.[0];

  return (
    <div style={{ padding: '20px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0 }}>
        {/* Listing thumbnail */}
        <div style={{ width: 56, height: 44, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-elevated)', flexShrink: 0 }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(photo.thumbnailUrl ?? photo.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><ImageOff size={16} /></div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {appt.listing?.title && (
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {appt.listing.title}
            </p>
          )}
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: apptColors[appt.status], display: 'block', marginBottom: 4 }}>
            {appt.status}
          </span>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>
            {formatDate(appt.scheduledAt)} · {new Date(appt.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </p>
          {appt.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{appt.notes}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <Link
          href={`/listings/${appt.listingId}`}
          style={{
            fontSize: 11, color: 'var(--accent)', textDecoration: 'none',
            whiteSpace: 'nowrap', padding: '5px 10px',
            border: '1px solid var(--border-accent)', borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <ExternalLink size={12} /> Ver anuncio
        </Link>
        {appt.status === 'confirmed' && (
          <ViewLocationButton listingId={appt.listingId} listing={appt.listing} />
        )}
        {canCancel && (
          <button
            style={{
              fontSize: 11, padding: '5px 10px', borderRadius: 6,
              border: '1px solid var(--border-light)', background: 'transparent',
              color: '#CC6E6E', cursor: deleteAppt.isPending ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
            }}
            disabled={deleteAppt.isPending}
            onClick={() => {
                sileo.action({
                  title: '¿Cancelar esta cita?',
                  description: 'La cita quedará cancelada.',
                  button: { title: 'Cancelar cita', onClick: () => deleteAppt.mutate(appt.id) },
                });
              }}
            onMouseEnter={(e) => { if (!deleteAppt.isPending) (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, #CC6E6E 10%, transparent)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <CalendarX2 size={12} />
            {deleteAppt.isPending ? 'Cancelando…' : 'Cancelar cita'}
          </button>
        )}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(appt.createdAt)}</span>
      </div>
    </div>
  );
}

// ─── View location button (for confirmed appointments) ────────────────────────
function ViewLocationButton({ listingId, listing: cachedListing }: { listingId: string; listing?: ListingResponse }) {
  const [loading, setLoading] = useState(false);

  const handleOpenMap = async () => {
    setLoading(true);
    try {
      const listing = cachedListing ?? await listings.get(listingId);
      const url =
        listing.latitude && listing.longitude
          ? `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              [listing.location, listing.sector].filter(Boolean).join(', ')
            )}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleOpenMap}
      disabled={loading}
      style={{
        fontSize: 11, padding: '5px 10px', borderRadius: 6,
        border: '1px solid var(--border-accent)', background: 'transparent',
        color: 'var(--accent)', cursor: loading ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <MapPin size={12} />
      {loading ? 'Cargando…' : 'Ver ubicación'}
    </button>
  );
}

// ─── Contact request row ──────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', responded: 'Aceptada', closed: 'Cerrada',
};

function ContactRequestRow({ cr, myId }: { cr: ContactRequestResponse; myId: string }) {
  const updateStatus = useUpdateContactRequestStatus(cr.listingId);
  const createAppt = useCreateAppointment(cr.listingId);

  // isSeller: I own the listing → I received this request
  const isSeller = cr.listing?.userId === myId;

  const [showApptForm, setShowApptForm] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  const handleAccept = () => {
    updateStatus.mutate({ id: cr.id, status: 'responded' }, {
      onSuccess: () => sileo.success({ title: 'Solicitud aceptada', description: 'Ahora puedes programar una cita.' }),
    });
  };

  const handleReject = () => {
    sileo.action({
      title: '¿Rechazar esta solicitud?',
      description: 'El usuario será notificado.',
      button: {
        title: 'Rechazar',
        onClick: () => updateStatus.mutate({ id: cr.id, status: 'closed' }, {
          onSuccess: () => sileo.info({ title: 'Solicitud rechazada' }),
        }),
      },
    });
  };

  const handleSchedule = () => {
    if (!apptDate) { sileo.error({ title: 'Selecciona fecha y hora' }); return; }
    createAppt.mutate({ scheduledAt: apptDate, notes: apptNotes.trim() || undefined }, {
      onSuccess: () => {
        sileo.success({ title: 'Cita creada', description: formatDate(apptDate) });
        setShowApptForm(false);
        setApptDate('');
        setApptNotes('');
      },
    });
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px' }}>
        {/* Title */}
        {cr.listing?.title && (
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cr.listing.title}
          </p>
        )}

        {/* Status row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: contactColors[cr.status] }}>
              {STATUS_LABELS[cr.status] ?? cr.status}
            </span>
            {isSeller && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 6px', border: '1px solid var(--border-light)', borderRadius: 4 }}>
                Solicitud recibida
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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

        {/* Message */}
        {cr.message && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, borderLeft: '3px solid var(--border-accent)', marginTop: 12 }}>
            {cr.message}
          </p>
        )}

        {/* Seller actions — Accept / Reject when pending */}
        {isSeller && cr.status === 'pending' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
              disabled={updateStatus.isPending}
              onClick={handleAccept}
            >
              <CheckCheck size={13} />
              {updateStatus.isPending ? 'Guardando…' : 'Aceptar'}
            </button>
            <button
              className="btn btn-outline"
              style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-error)', borderColor: 'color-mix(in srgb, var(--color-error) 30%, transparent)' }}
              disabled={updateStatus.isPending}
              onClick={handleReject}
            >
              <X size={13} /> Rechazar
            </button>
          </div>
        )}

        {/* Seller: schedule appointment when accepted */}
        {isSeller && cr.status === 'responded' && (
          <div style={{ marginTop: 16 }}>
            {!showApptForm ? (
              <button
                className="btn btn-outline"
                style={{ fontSize: 12, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={() => setShowApptForm(true)}
              >
                <Calendar size={13} /> Programar cita
              </button>
            ) : (
              <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Programar cita</p>
                <input
                  type="datetime-local"
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  className="field"
                  style={{ fontSize: 13 }}
                />
                <textarea
                  value={apptNotes}
                  onChange={(e) => setApptNotes(e.target.value)}
                  className="field"
                  placeholder="Notas opcionales para el comprador…"
                  rows={2}
                  style={{ resize: 'none', fontSize: 13 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '7px 16px' }}
                    disabled={createAppt.isPending}
                    onClick={handleSchedule}
                  >
                    {createAppt.isPending ? 'Creando…' : 'Confirmar cita'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '7px 10px' }}
                    onClick={() => { setShowApptForm(false); setApptDate(''); setApptNotes(''); }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Non-seller: close option when not yet closed */}
        {!isSeller && cr.status !== 'closed' && (
          <div style={{ marginTop: 12 }}>
            <button
              style={{
                fontSize: 11, padding: '5px 10px', borderRadius: 6,
                border: '1px solid var(--border-light)', background: 'transparent',
                color: 'var(--text-muted)', cursor: updateStatus.isPending ? 'default' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
              }}
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ id: cr.id, status: 'closed' })}
            >
              <CheckCheck size={12} />
              {updateStatus.isPending ? 'Cerrando…' : 'Marcar como cerrada'}
            </button>
          </div>
        )}

        {cr.respondedAt && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
            Respondida el {formatDate(cr.respondedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Ratings tab ──────────────────────────────────────────────────────────────
const STAR_COLORS = ['', '#CC6E6E', '#CC9E6E', '#C8B458', '#A4C46E', '#6ECC96'];

function RatingsTab() {
  const [cursor, setCursor] = useState<string | undefined>();
  const [filterScore, setFilterScore] = useState<number | null>(null);
  const { data, isLoading } = useMyRatings(cursor);
  const ratings = data?.data ?? [];
  const meta = data?.meta;

  // Stats
  const avgScore = ratings.length > 0
    ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: ratings.filter((r) => r.score === score).length,
    pct: ratings.length > 0 ? (ratings.filter((r) => r.score === score).length / ratings.length) * 100 : 0,
  }));

  const visible = filterScore !== null ? ratings.filter((r) => r.score === filterScore) : ratings;

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ height: 120, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', opacity: 0.4 }} />
        ))}
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <EmptyState
        icon={<Star size={32} />}
        title="Sin calificaciones aún"
        subtitle="Califica los anuncios que visites para verlos aquí."
        action={{ label: 'Explorar anuncios', href: '/listings' }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── Summary panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', alignItems: 'center' }}>
        {/* Big average */}
        <div style={{ textAlign: 'center', paddingRight: 24, borderRight: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', fontWeight: 300, lineHeight: 1, color: STAR_COLORS[Math.round(avgScore)] ?? 'var(--accent)' }}>
            {avgScore.toFixed(1)}
          </p>
          <div style={{ margin: '8px 0 4px' }}>
            <StarRating value={avgScore} size={16} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            {ratings.length} calificación{ratings.length !== 1 ? 'es' : ''}
          </p>
        </div>

        {/* Distribution bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {distribution.map(({ score, count, pct }) => (
            <button
              key={score}
              onClick={() => setFilterScore(filterScore === score ? null : score)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0',
                opacity: filterScore !== null && filterScore !== score ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <span style={{ fontSize: 12, color: STAR_COLORS[score], fontWeight: 600, width: 14, textAlign: 'right', flexShrink: 0 }}>
                {score}
              </span>
              <Star size={12} fill={STAR_COLORS[score]} stroke={STAR_COLORS[score]} />
              <div style={{ flex: 1, height: 8, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${pct}%`,
                  background: STAR_COLORS[score],
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 20, textAlign: 'right', flexShrink: 0 }}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter indicator ── */}
      {filterScore !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Mostrando solo calificaciones de {filterScore} estrella{filterScore !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setFilterScore(null)}
            style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Ver todas
          </button>
        </div>
      )}

      {/* ── Rating cards grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {visible.map((r) => (
          <Link
            key={r.id}
            href={`/listings/${r.listingId}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '20px', display: 'flex', flexDirection: 'column', gap: 12,
              transition: 'border-color 0.15s, transform 0.15s',
              cursor: 'pointer',
            }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = 'var(--border-accent)';
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = 'var(--border)';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Score badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 999,
                  background: `color-mix(in srgb, ${STAR_COLORS[r.score]} 15%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${STAR_COLORS[r.score]} 30%, transparent)`,
                }}>
                  <Star size={12} fill={STAR_COLORS[r.score]} stroke={STAR_COLORS[r.score]} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: STAR_COLORS[r.score] }}>{r.score}</span>
                  <span style={{ fontSize: 11, color: STAR_COLORS[r.score], opacity: 0.7 }}>/ 5</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(r.createdAt)}</span>
              </div>

              {/* Stars visual */}
              <StarRating value={r.score} size={18} />

              {/* Listing link */}
              <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>
                  Anuncio
                </p>
                <p style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'monospace' }}>
                  {r.listingId.slice(0, 16)}…
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Pagination ── */}
      {(meta?.hasNextPage || meta?.hasPreviousPage) && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-outline" disabled={!meta.hasPreviousPage} onClick={() => setCursor(meta.previousCursor ?? undefined)} style={{ fontSize: 13 }}>
            ← Anterior
          </button>
          <button className="btn btn-outline" disabled={!meta.hasNextPage} onClick={() => setCursor(meta.nextCursor ?? undefined)} style={{ fontSize: 13 }}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function DashboardClient() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const queryClient = useQueryClient();

  // mounted guard: server and client first render are both false → identical output
  // → no hydration mismatch. After mount, queries enable and real content loads.
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
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: listingsData, isLoading: listingsLoading } = useMyListings();
  const { data: apptData, isLoading: apptLoading } = useMyAppointments();
  const { data: contactData, isLoading: contactLoading } = useMyContactRequests();
  const { data: favData } = useMyFavorites();

  const updateProfile = useUpdateProfile();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tab = p.get('tab') as Tab | null;
    const valid: Tab[] = ['overview', 'listings', 'appointments', 'contact-requests', 'ratings', 'profile',
      'admin-categories', 'admin-users', 'admin-reports', 'admin-legal', 'admin-contact'];
    if (tab && valid.includes(tab)) setActiveTab(tab);
    setMounted(true);
  }, []);

  // Keep scroll arrows in sync using ResizeObserver (fires when tabs render/change)
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

  // Re-check when profile loads (tabs list may grow with admin tabs)
  useEffect(() => {
    // rAF ensures DOM has painted with the new tabs before measuring
    const id = requestAnimationFrame(updateScrollState);
    return () => cancelAnimationFrame(id);
  }, [profile, updateScrollState]);

  // Redirect unauthenticated users — runs client-side only, after mount
  useEffect(() => {
    if (mounted && !profileLoading && !profile) {
      router.push('/auth/login?redirect=/dashboard');
    }
  }, [mounted, profileLoading, profile, router]);

  // Before first mount: render nothing (matches server output exactly)
  if (!mounted) return null;

  if (profileLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>{t('loading')}</p>
      </div>
    );
  }
  if (!profile) return null;

  const myListings = listingsData?.data ?? [];
  const appointments = apptData?.data ?? [];
  const contactReqs = contactData?.data ?? [];
  const favs = favData?.data ?? [];

  const activeListings = myListings.filter((l) => l.status === 'active').length;
  const draftListings = myListings.filter((l) => l.status === 'draft').length;
  const pendingAppts = appointments.filter((a) => a.status === 'pending').length;
  const confirmedAppts = appointments.filter((a) => a.status === 'confirmed').length;
  const pendingContacts = contactReqs.filter((c) => c.status === 'pending').length;

  const handleSaveProfile = () => {
    setProfileMsg('');
    updateProfile.mutate(editName || profile.name, {
      onSuccess: () => { setProfileMsg(t('profileSaved')); setEditingName(false); },
      onError: (e) => setProfileMsg((e as Error).message),
    });
  };

  const handleLogout = () => {
    clearTokens();
    queryClient.clear();
    router.push('/');
  };

  const isAdmin = profile.role === 'admin' || profile.role === 'owner';

  const tabs: { id: Tab; label: string; icon?: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'overview', label: t('tabOverview'), icon: <LayoutGrid size={12} /> },
    { id: 'listings', label: t('tabListings'), icon: <Hash size={12} /> },
    { id: 'appointments', label: t('tabAppointments'), icon: <CalendarDays size={12} /> },
    { id: 'contact-requests', label: t('tabContactRequests'), icon: <MessageSquare size={12} /> },
    { id: 'ratings', label: 'Calificaciones', icon: <Star size={12} /> },
    { id: 'profile', label: t('tabProfile'), icon: <Shield size={12} /> },
    ...(isAdmin ? [
      { id: 'admin-categories' as Tab, label: 'Categorías', icon: <Tag size={12} />, adminOnly: true },
      { id: 'admin-users' as Tab, label: 'Usuarios', icon: <Users size={12} />, adminOnly: true },
      { id: 'admin-reports' as Tab, label: 'Reportes', icon: <Flag size={12} />, adminOnly: true },
      { id: 'admin-legal' as Tab, label: 'Legal', icon: <FileText size={12} />, adminOnly: true },
      { id: 'admin-contact' as Tab, label: 'Contacto', icon: <Settings size={12} />, adminOnly: true },
    ] : []),
  ];

  return (
    <div className="container-wide" style={{ padding: '48px 24px 80px', flex: 1 }}>
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
            {profile.role.toUpperCase()}
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 300 }}>
            {t('welcomePrefix')} <em style={{ fontStyle: 'italic', color: 'var(--accent-light)' }}>{profile.name.split(' ')[0]}</em>
          </h1>
        </div>
        <Link href="/listings/new" className="btn btn-primary">{t('newListing')}</Link>
      </div>

      {/* Tabs */}
      <div style={{ position: 'relative', marginBottom: 40 }}>
        {/* Left arrow */}
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

        {/* Scrollable tab strip */}
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

        {/* Right arrow */}
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

      {/* ── Overview ───────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div>
          {/* Big metric cards — centered */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginBottom: 48 }}>
            <MetricCard
              icon={<LayoutGrid size={22} />}
              value={myListings.length}
              label={t('statListings')}
              accent="#C87D38"
              sub={[
                { text: `${activeListings} activos`, color: '#6ECC96' },
                ...(draftListings > 0 ? [{ text: `${draftListings} borradores`, color: 'var(--text-muted)' }] : []),
              ]}
              action={{ label: 'Mis anuncios', href: '#' }}
            />
            <MetricCard
              icon={<CalendarDays size={22} />}
              value={appointments.length}
              label={t('statAppointments')}
              accent="#6ECC96"
              sub={[
                { text: `${pendingAppts} pendientes`, color: '#CC9E6E' },
                { text: `${confirmedAppts} confirmadas`, color: '#6ECC96' },
              ]}
            />
            <MetricCard
              icon={<MessageSquare size={22} />}
              value={contactReqs.length}
              label={t('statContacts')}
              accent="var(--text-secondary)"
              sub={[
                { text: `${pendingContacts} sin responder`, color: pendingContacts > 0 ? '#CC9E6E' : 'var(--text-muted)' },
                { text: `${contactReqs.length - pendingContacts} gestionadas`, color: '#6ECC96' },
              ]}
            />
            <MetricCard
              icon={<Heart size={22} />}
              value={favs.length}
              label={t('statFavorites')}
              accent="#CC6E6E"
              sub={favs.length > 0 ? [{ text: 'Anuncios guardados', color: 'var(--text-muted)' }] : []}
            />
          </div>

          {/* Recent listings */}
          {myListings.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400 }}>{t('recentListings')}</h2>
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

          {/* Upcoming appointments */}
          {appointments.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400 }}>{t('upcomingAppts')}</h2>
                <button
                  onClick={() => switchTab('appointments')}
                  style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Ver todas <ArrowRight size={13} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {appointments.slice(0, 3).map((a) => (
                  <div key={a.id} style={{ padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(a.scheduledAt)}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(a.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        {a.notes ? ` · ${a.notes}` : ''}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: apptColors[a.status] }}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Listings ───────────────────────────────────────────────────────── */}
      {activeTab === 'listings' && (
        <div>
          {listingsLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('loading')}</p>
          ) : myListings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {myListings.map((l) => <ListingStatsRow key={l.id} listing={l} />)}
            </div>
          ) : (
            <EmptyState
              icon={<ImageOff size={32} />}
              title={t('noListings')}
              action={{ label: t('createFirst'), href: '/listings/new' }}
            />
          )}
        </div>
      )}

      {/* ── Appointments ───────────────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div>
          {apptLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('loading')}</p>
          ) : appointments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {appointments.map((a) => <AppointmentRow key={a.id} appt={a} />)}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarDays size={32} />}
              title={t('noAppointments')}
            />
          )}
        </div>
      )}

      {/* ── Contact Requests ───────────────────────────────────────────────── */}
      {activeTab === 'contact-requests' && (
        <div>
          {contactLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('loading')}</p>
          ) : contactReqs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {contactReqs.map((cr) => <ContactRequestRow key={cr.id} cr={cr} myId={profile.id} />)}
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquare size={32} />}
              title={t('noContactRequests')}
            />
          )}
        </div>
      )}

      {/* ── Ratings ─────────────────────────────────────────────────────────── */}
      {activeTab === 'ratings' && <RatingsTab />}

      {/* ── Admin tabs ─────────────────────────────────────────────────────── */}
      {activeTab === 'admin-categories' && isAdmin && <CategoriesAdmin embedded />}
      {activeTab === 'admin-users' && isAdmin && <UsersAdmin embedded />}
      {activeTab === 'admin-reports' && isAdmin && <ReportsAdmin embedded />}
      {activeTab === 'admin-legal' && isAdmin && <LegalAdmin embedded />}
      {activeTab === 'admin-contact' && isAdmin && <ContactConfigAdmin embedded />}

      {/* ── Profile ────────────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div>
          {/* Full-width identity card */}
          <div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              {/* Banner */}
              <div style={{ height: 90, background: `linear-gradient(135deg, var(--accent-dim), color-mix(in srgb, var(--accent) 40%, var(--bg-elevated)))`, position: 'relative' }}>
                <div style={{
                  position: 'absolute', bottom: -34, left: 32,
                  width: 68, height: 68, borderRadius: 14,
                  background: 'var(--accent)',
                  border: '3px solid var(--bg-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-inverse)',
                  fontFamily: 'var(--font-body)', letterSpacing: 0,
                }}>
                  {profile.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              </div>

              <div style={{ padding: '48px 32px 32px' }}>
                {/* Name + edit */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                  <div>
                    {editingName ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          defaultValue={profile.name}
                          onChange={(e) => setEditName(e.target.value)}
                          className="field"
                          style={{ fontSize: 16, padding: '6px 12px', width: 200 }}
                          autoFocus
                          minLength={2}
                          maxLength={120}
                        />
                        <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }} onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                          <Save size={12} />
                          {updateProfile.isPending ? t('savingBtn') : t('saveBtn')}
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '7px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setEditingName(false)}>
                          <X size={12} /> Cancelar
                        </button>
                      </div>
                    ) : (
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, marginBottom: 2 }}>{profile.name}</h2>
                    )}
                    {profileMsg && (
                      <p style={{ fontSize: 12, color: profileMsg.includes('!') ? '#6ECC96' : '#CC6E6E', marginTop: 4 }}>{profileMsg}</p>
                    )}
                  </div>
                  {!editingName && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: '5px 14px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
                      onClick={() => { setEditingName(true); setEditName(profile.name); setProfileMsg(''); }}
                    >
                      <Pencil size={11} /> Editar
                    </button>
                  )}
                </div>

                {/* Detail rows */}
                {[
                  { icon: <Mail size={11} />, label: t('emailLabel'), value: profile.email },
                  { icon: <Shield size={11} />, label: t('roleLabel'), value: profile.role.charAt(0).toUpperCase() + profile.role.slice(1) },
                  { icon: <Hash size={11} />, label: 'ID', value: profile.id.slice(0, 8) + '…' },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {icon} {label}
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</p>
                  </div>
                ))}

                {/* Sign out */}
                <div style={{ marginTop: 24 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={handleLogout}
                    style={{ fontSize: 13, color: '#CC6E6E', padding: '7px 0', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <LogOut size={14} /> {t('signOut')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
