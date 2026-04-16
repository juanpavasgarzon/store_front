'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '../../../../i18n/navigation';
import { useProfile, useLegalDocuments, useUpsertLegalDocument } from '../../../lib/hooks';
import type { LegalDocument } from '../../../lib/types/legal';
import { FileText, Save, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: 6,
};

const DEFAULT_SLUGS = [
  { slug: 'terminos-de-servicio', title: 'Términos de servicio' },
  { slug: 'politica-de-privacidad', title: 'Política de privacidad' },
  { slug: 'politica-de-cookies', title: 'Política de cookies' },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function DocEditor({ doc, onSaved }: { doc?: LegalDocument; slug: string; title: string; onSaved?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(doc?.title ?? '');
  const [editContent, setEditContent] = useState(doc?.content ?? '');
  const [saved, setSaved] = useState(false);
  const upsert = useUpsertLegalDocument();

  const isNew = !doc;

  const handleSave = () => {
    setSaved(false);
    upsert.mutate(
      { slug: doc?.slug ?? '', title: editTitle, content: editContent },
      { onSuccess: () => { setSaved(true); onSaved?.(); } }
    );
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <FileText size={16} color={isNew ? 'var(--text-muted)' : 'var(--accent)'} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: isNew ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {doc?.title ?? `Sin crear`}
          </p>
          {doc && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Actualizado: {formatDate(doc.updatedAt)} · {doc.content.length} caracteres
            </p>
          )}
        </div>
        {isNew && (
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px dashed var(--border-light)', color: 'var(--text-muted)', fontWeight: 600 }}>
            VACÍO
          </span>
        )}
        {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </div>

      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Título</label>
              <input
                type="text"
                className="field"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Título del documento"
                style={{ fontSize: 13 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Contenido (Markdown soportado)</label>
              <textarea
                className="field"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={16}
                placeholder="Escribe el contenido del documento legal aquí…"
                style={{ fontSize: 13, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6 }}
              />
            </div>

            {upsert.isError && (
              <p style={{ fontSize: 12, color: 'var(--color-error)' }}>
                Error al guardar: {(upsert.error as Error).message}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                disabled={upsert.isPending || !editTitle.trim() || !editContent.trim()}
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              >
                <Save size={14} />
                {upsert.isPending ? 'Guardando…' : 'Guardar documento'}
              </button>
              {saved && <span style={{ fontSize: 13, color: 'var(--color-success)' }}>¡Guardado!</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewDocForm({ onCreated }: { onCreated: () => void }) {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expanded, setExpanded] = useState(false);
  const upsert = useUpsertLegalDocument();

  const handleCreate = () => {
    upsert.mutate({ slug, title, content }, {
      onSuccess: () => { setSlug(''); setTitle(''); setContent(''); setExpanded(false); onCreated(); },
    });
  };

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-light)', borderRadius: 12, overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Plus size={16} color="var(--accent)" />
        <p style={{ flex: 1, fontSize: 14, color: 'var(--accent)', fontWeight: 500 }}>Nuevo documento legal</p>
        {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </div>
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Título</label>
                <input type="text" className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Aviso legal" style={{ fontSize: 13 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Slug (URL)</label>
                <input type="text" className="field" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="aviso-legal" style={{ fontSize: 13, fontFamily: 'monospace' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Contenido</label>
              <textarea className="field" value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Contenido…" style={{ fontSize: 13, resize: 'vertical' }} />
            </div>
            {upsert.isError && <p style={{ fontSize: 12, color: 'var(--color-error)' }}>{(upsert.error as Error).message}</p>}
            <button
              className="btn btn-primary"
              disabled={upsert.isPending || !slug.trim() || !title.trim() || !content.trim()}
              onClick={handleCreate}
              style={{ fontSize: 13, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={14} /> {upsert.isPending ? 'Creando…' : 'Crear documento'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LegalAdmin({ embedded }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: docs, isLoading, refetch } = useLegalDocuments();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (!embedded && mounted && !profileLoading && (!profile || !isAdmin)) {
      router.push('/');
    }
  }, [embedded, mounted, profileLoading, profile, isAdmin, router]);

  if (!embedded && !mounted) return null;

  if (!embedded && profileLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando…</p>
      </div>
    );
  }

  if (!profile || !isAdmin) return null;

  const existingDocs = (docs as LegalDocument[] | undefined) ?? [];

  // Merge default slugs with existing docs
  const knownSlugs = DEFAULT_SLUGS.map((d) => ({
    ...d,
    doc: existingDocs.find((e) => e.slug === d.slug),
  }));
  const extraDocs = existingDocs.filter((d) => !DEFAULT_SLUGS.some((ds) => ds.slug === d.slug));

  const content = (
    <>
      {!embedded && (
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
            ADMINISTRACIÓN
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 300, marginBottom: 8 }}>
            Documentos <em style={{ fontStyle: 'italic', color: 'var(--accent-light)' }}>legales</em>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {isLoading ? 'Cargando…' : `${existingDocs.length} documento${existingDocs.length !== 1 ? 's' : ''} publicado${existingDocs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 64, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', opacity: 0.5 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {knownSlugs.map(({ slug, title, doc }) => (
            <DocEditor key={slug} slug={slug} title={title} doc={doc} onSaved={() => refetch()} />
          ))}
          {extraDocs.map((doc) => (
            <DocEditor key={doc.slug} slug={doc.slug} title={doc.title} doc={doc} onSaved={() => refetch()} />
          ))}
          <NewDocForm onCreated={() => refetch()} />
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
