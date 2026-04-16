'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '../../../../i18n/navigation';
import { getAccessToken } from '../../../lib/api';
import {
  useAddFavorite,
  useRemoveFavorite,
  useMyFavorites,
  useCreateContactRequest,
  useMyContactRequests,
  useCreateAppointment,
  useCreateRating,
  useMyRatingForListing,
  useCreateReport,
  useProfile,
} from '../../../lib/hooks';
import type { ReportReason } from '../../../lib/types';
import { Heart, Star, CheckCircle } from 'lucide-react';

interface Props {
  listingId: string;
  type: 'contact' | 'appointment' | 'favorite' | 'report' | 'rating';
  listingUserId?: string;
  initialAvg?: number;
  initialCount?: number;
}

export default function ContactButton({ listingId, type, listingUserId, initialAvg = 0, initialCount = 0 }: Props) {
  const t = useTranslations('contact');
  const router = useRouter();
  const { data: profile } = useProfile();
  const isOwner = !!listingUserId && !!profile?.id && profile.id === listingUserId;

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');

  // Report state
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportDetails, setReportDetails] = useState('');

  // Rating state
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const { data: myExistingRating } = useMyRatingForListing(listingId);

  // Sync existing rating from server once loaded
  const [ratingInitialized, setRatingInitialized] = useState(false);
  if (!ratingInitialized && myExistingRating?.score) {
    setSelectedStar(myExistingRating.score);
    setRatingInitialized(true);
  }

  const requireAuth = () => {
    if (!getAccessToken()) {
      router.push(`/auth/login?redirect=/listings/${listingId}`);
      return false;
    }
    return true;
  };

  // ─── Mutation hooks (with cache invalidation built-in) ─────────────────────
  const addFavorite = useAddFavorite(listingId);
  const removeFavorite = useRemoveFavorite(listingId);
  const createContact = useCreateContactRequest(listingId);
  const createAppt = useCreateAppointment(listingId);
  const createRating = useCreateRating(listingId);
  const createReport = useCreateReport(listingId);

  // Check if already favorited via cache
  const { data: favData } = useMyFavorites();
  const isFavorited = favData?.data?.some((f) => f.listingId === listingId) ?? false;

  // Check if already sent a contact request for this listing
  const { data: contactData } = useMyContactRequests();
  const alreadyRequested = contactData?.data?.some((cr) => cr.listingId === listingId) ?? false;

  // ─── Favorite ──────────────────────────────────────────────────────────────

  if (type === 'favorite') {
    if (isOwner) return null;
    const saved = isFavorited || addFavorite.isSuccess;
    const pending = addFavorite.isPending || removeFavorite.isPending;

    return (
      <button
        className="btn btn-outline"
        disabled={pending}
        onClick={() => {
          if (!requireAuth()) return;
          if (saved) {
            removeFavorite.mutate();
          } else {
            addFavorite.mutate();
          }
        }}
        style={{
          width: '100%',
          color: saved ? 'var(--accent)' : undefined,
          borderColor: saved ? 'var(--accent-dim)' : undefined,
        }}
      >
        <Heart
          size={15}
          fill={saved ? 'currentColor' : 'none'}
          style={{ marginRight: 6, verticalAlign: 'middle', display: 'inline' }}
        />
        {pending
          ? (saved ? 'Eliminando…' : 'Guardando…')
          : saved
          ? 'Guardado en favoritos'
          : 'Guardar en favoritos'}
      </button>
    );
  }

  // ─── Contact request ───────────────────────────────────────────────────────

  if (type === 'contact') {
    if (isOwner) return null;

    // Already sent a request — show disabled state
    if (alreadyRequested || createContact.isSuccess) {
      return (
        <button className="btn btn-outline" disabled style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}>
          <CheckCircle size={15} style={{ marginRight: 6, verticalAlign: 'middle', display: 'inline', color: 'var(--color-success)' }} />
          {t('sent')}
        </button>
      );
    }

    if (!showForm) return (
      <button className="btn btn-primary" onClick={() => { if (requireAuth()) setShowForm(true); }} style={{ width: '100%' }}>
        {t('send')}
      </button>
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <textarea className="field" placeholder={t('msgPlaceholder')} value={message} onChange={(e) => setMessage(e.target.value)} rows={3} style={{ resize: 'vertical', fontSize: 13 }} />
        {createContact.error && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{(createContact.error as Error).message}</p>}
        <button className="btn btn-primary" disabled={createContact.isPending} onClick={() => {
          if (!requireAuth()) return;
          createContact.mutate(message || undefined);
        }} style={{ width: '100%' }}>
          {createContact.isPending ? t('sending') : t('send')}
        </button>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ fontSize: 12 }}>{t('cancel')}</button>
      </div>
    );
  }

  // ─── Appointment ───────────────────────────────────────────────────────────

  if (type === 'appointment') {
    // Show only when logged in AND not the listing owner
    if (!profile || isOwner) return null;
    if (!showForm) return (
      <button className="btn btn-outline" onClick={() => { if (requireAuth()) setShowForm(true); }} style={{ width: '100%' }}>
        {t('confirmAppt')}
      </button>
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input type="datetime-local" className="field" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 16)} style={{ fontSize: 13 }} />
        <textarea className="field" placeholder={t('notesPlaceholder')} value={message} onChange={(e) => setMessage(e.target.value)} rows={2} style={{ resize: 'vertical', fontSize: 13 }} />
        {createAppt.error && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{(createAppt.error as Error).message}</p>}
        {createAppt.isSuccess ? (
          <p style={{ fontSize: 13, color: 'var(--color-success)', padding: '8px 0' }}>{t('scheduled')}</p>
        ) : (
          <button className="btn btn-outline" disabled={createAppt.isPending || !date} onClick={() => {
            if (!requireAuth()) return;
            createAppt.mutate({ scheduledAt: new Date(date).toISOString(), notes: message || undefined });
          }} style={{ width: '100%' }}>
            {createAppt.isPending ? t('scheduling') : t('confirmAppt')}
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ fontSize: 12 }}>{t('cancel')}</button>
      </div>
    );
  }

  // ─── Rating ────────────────────────────────────────────────────────────────

  if (type === 'rating') {
    if (isOwner) return null;
    return (
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {t('rateTitle')}
          {initialCount > 0 && (
            <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
              · {initialAvg.toFixed(1)} ({initialCount})
            </span>
          )}
        </p>
        {createRating.isSuccess ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', gap: 2 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < selectedStar ? 'var(--accent)' : 'none'}
                  stroke={i < selectedStar ? 'var(--accent)' : 'var(--border-light)'}
                />
              ))}
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-success)' }}>{t('rateSaved')}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {Array.from({ length: 5 }, (_, i) => {
              const star = i + 1;
              const filled = star <= (hoverStar || selectedStar);
              return (
                <button
                  key={star}
                  onClick={() => {
                    if (!requireAuth()) return;
                    setSelectedStar(star);
                    createRating.mutate(star);
                  }}
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                    transition: 'transform 0.1s',
                    transform: hoverStar === star ? 'scale(1.2)' : 'scale(1)',
                  }}
                  disabled={createRating.isPending}
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    size={24}
                    fill={filled ? 'var(--accent)' : 'none'}
                    stroke={filled ? 'var(--accent)' : 'var(--border-light)'}
                  />
                </button>
              );
            })}
            {createRating.isPending && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{t('rateSaving')}</span>
            )}
            {createRating.error && (
              <span style={{ fontSize: 12, color: 'var(--color-error)', marginLeft: 8 }}>{(createRating.error as Error).message}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Report ────────────────────────────────────────────────────────────────

  if (type === 'report') {
    if (createReport.isSuccess) {
      return <p style={{ fontSize: 13, color: 'var(--color-success)', textAlign: 'center', padding: '8px 0' }}>{t('reportDone')}</p>;
    }

    if (!showForm) {
      return (
        <button
          className="btn btn-ghost"
          style={{ width: '100%', fontSize: 11, color: 'var(--text-muted)', padding: '6px' }}
          onClick={() => { if (requireAuth()) setShowForm(true); }}
        >
          {t('reportBtn')}
        </button>
      );
    }

    const reasonOptions: { value: ReportReason; labelKey: string }[] = [
      { value: 'spam', labelKey: 'reportReasonSpam' },
      { value: 'fraud', labelKey: 'reportReasonFraud' },
      { value: 'inappropriate', labelKey: 'reportReasonInappropriate' },
      { value: 'duplicate', labelKey: 'reportReasonDuplicate' },
      { value: 'wrong_category', labelKey: 'reportReasonWrongCategory' },
      { value: 'other', labelKey: 'reportReasonOther' },
    ];

    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>{t('reportTitle')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
              {t('reportReasonLabel')}
            </label>
            <select
              className="field"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              style={{ fontSize: 13 }}
            >
              {reasonOptions.map(({ value, labelKey }) => (
                <option key={value} value={value}>{t(labelKey as Parameters<typeof t>[0])}</option>
              ))}
            </select>
          </div>
          <textarea
            className="field"
            placeholder={t('reportDetailsPlaceholder')}
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            rows={3}
            maxLength={1000}
            style={{ resize: 'vertical', fontSize: 13 }}
          />
          {createReport.error && (
            <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{(createReport.error as Error).message}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-outline"
              style={{ fontSize: 12, flex: 1 }}
              disabled={createReport.isPending}
              onClick={() => {
                if (!requireAuth()) return;
                createReport.mutate({ reason: reportReason, details: reportDetails || undefined });
              }}
            >
              {createReport.isPending ? t('reportSubmitting') : t('reportSubmit')}
            </button>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowForm(false)}>
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
