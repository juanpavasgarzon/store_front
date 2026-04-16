'use client';

import { useState } from 'react';
import { useListingComments, useCreateComment, useProfile } from '../../../lib/hooks';
import { getAccessToken } from '../../../lib/api';
import { useRouter } from '../../../../i18n/navigation';

interface Props {
  listingId: string;
  listingUserId?: string;
  locale: string;
}

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-CO' : 'es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CommentsSection({ listingId, listingUserId, locale }: Props) {
  const router = useRouter();
  const { data, isLoading } = useListingComments(listingId);
  const createComment = useCreateComment(listingId);
  const { data: profile } = useProfile();
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');

  const isOwner = !!listingUserId && !!profile?.id && profile.id === listingUserId;
  const commentsList = data?.data ?? [];

  const requireAuth = () => {
    if (!getAccessToken()) {
      router.push(`/auth/login?redirect=/listings/${listingId}`);
      return false;
    }
    return true;
  };

  const handlePost = () => {
    if (!requireAuth()) return;
    createComment.mutate(text, {
      onSuccess: () => {
        setText('');
        setShowForm(false);
      },
    });
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400, marginBottom: 20 }}>
        Comentarios{commentsList.length > 0 ? ` (${commentsList.length})` : ''}
      </h2>

      {isLoading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Cargando…</p>
      ) : commentsList.length > 0 ? (
        /* Single card with dividers between comments */
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          {commentsList.map((comment, index) => (
            <div key={comment.id}>
              {index > 0 && (
                <div style={{ height: 1, background: 'var(--border)', margin: '0' }} />
              )}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {/* Avatar */}
                  <span style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'var(--accent-dim)', color: 'var(--accent-light)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {getInitials(comment.userName ?? 'U')}
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {comment.userName ?? 'Usuario'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10 }}>
                      {formatDate(comment.createdAt, locale)}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          Sin comentarios aún. Sé el primero.
        </p>
      )}

      {/* Comment form — hidden for listing owners */}
      {!isOwner && (
        showForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              className="field"
              placeholder="Escribe tu comentario…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={2000}
              style={{ resize: 'vertical', fontSize: 13 }}
              autoFocus
            />
            {createComment.error && (
              <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{(createComment.error as Error).message}</p>
            )}
            {createComment.isSuccess && (
              <p style={{ fontSize: 13, color: 'var(--color-success)' }}>✓ ¡Comentario publicado!</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                disabled={createComment.isPending || !text.trim()}
                onClick={handlePost}
                style={{ fontSize: 13 }}
              >
                {createComment.isPending ? 'Publicando…' : 'Publicar comentario'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ fontSize: 13 }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-ghost"
            onClick={() => { if (requireAuth()) setShowForm(true); }}
            style={{ fontSize: 13 }}
          >
            + Agregar comentario
          </button>
        )
      )}
    </div>
  );
}
