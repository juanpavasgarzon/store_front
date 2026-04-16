'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../../lib/api';
import {
  useAddFavorite,
  useRemoveFavorite,
  useMyFavorites,
  useCreateContactRequest,
  useMyContactRequests,
  useCreateReport,
  useProfile,
} from '../../lib/hooks';
import type { ReportReason } from '../../lib/types';
import { Heart, CheckCircle } from 'lucide-react';

interface Props {
  listingId: string;
  type: 'contact' | 'favorite' | 'report';
  listingUserId?: string;
}

export default function ContactButton({ listingId, type, listingUserId }: Props) {
  const router = useRouter();
  const { data: profile } = useProfile();
  const isOwner = !!listingUserId && !!profile?.id && profile.id === listingUserId;

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportDetails, setReportDetails] = useState('');

  const requireAuth = () => {
    if (!getAccessToken()) {
      router.push(`/auth/login?redirect=/listings/${listingId}`);
      return false;
    }
    return true;
  };

  const addFavorite = useAddFavorite(listingId);
  const removeFavorite = useRemoveFavorite(listingId);
  const createContact = useCreateContactRequest(listingId);
  const createReport = useCreateReport(listingId);

  const { data: favData } = useMyFavorites();
  const isFavorited = favData?.data?.some((f) => f.listingId === listingId) ?? false;

  const { data: contactData } = useMyContactRequests();
  const alreadyRequested = contactData?.data?.some((cr) => cr.listingId === listingId) ?? false;

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

  if (type === 'contact') {
    if (isOwner) return null;

    if (alreadyRequested || createContact.isSuccess) {
      return (
        <button className="btn btn-outline" disabled style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }}>
          <CheckCircle size={15} style={{ marginRight: 6, verticalAlign: 'middle', display: 'inline', color: 'var(--color-success)' }} />
          {'¡Mensaje enviado!'}
        </button>
      );
    }

    if (!showForm) return (
      <button className="btn btn-outline" onClick={() => { if (requireAuth()) setShowForm(true); }} style={{ width: '100%' }}>
        {'Enviar mensaje'}
      </button>
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <textarea className="field" placeholder={'Mensaje al vendedor…'} value={message} onChange={(e) => setMessage(e.target.value)} rows={3} style={{ resize: 'vertical', fontSize: 13 }} />
        {createContact.error && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{(createContact.error as Error).message}</p>}
        <button className="btn btn-primary" disabled={createContact.isPending} onClick={() => {
          if (!requireAuth()) return;
          createContact.mutate(message || undefined);
        }} style={{ width: '100%' }}>
          {createContact.isPending ? 'Enviando…' : 'Enviar mensaje'}
        </button>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ fontSize: 12 }}>{'Cancelar'}</button>
      </div>
    );
  }

  if (type === 'report') {
    if (createReport.isSuccess) {
      return <p style={{ fontSize: 13, color: 'var(--color-success)', textAlign: 'center', padding: '8px 0' }}>{'Reporte enviado'}</p>;
    }

    if (!showForm) {
      return (
        <button
          className="btn btn-ghost"
          style={{ width: '100%', fontSize: 11, color: 'var(--text-muted)', padding: '6px' }}
          onClick={() => { if (requireAuth()) setShowForm(true); }}
        >
          {'Reportar este anuncio'}
        </button>
      );
    }

    const reasonOptions: { value: ReportReason; label: string }[] = [
      { value: 'spam', label: 'Spam' },
      { value: 'fraud', label: 'Fraude' },
      { value: 'inappropriate', label: 'Contenido inapropiado' },
      { value: 'duplicate', label: 'Anuncio duplicado' },
      { value: 'wrong_category', label: 'Categoría incorrecta' },
      { value: 'other', label: 'Otro' },
    ];

    return (
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px' }}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>{'Reportar anuncio'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
              {'Motivo'}
            </label>
            <select
              className="field"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              style={{ fontSize: 13 }}
            >
              {reasonOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <textarea
            className="field"
            placeholder={'Detalles adicionales (opcional)…'}
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
              {createReport.isPending ? 'Enviando…' : 'Enviar reporte'}
            </button>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowForm(false)}>
              {'Cancelar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
