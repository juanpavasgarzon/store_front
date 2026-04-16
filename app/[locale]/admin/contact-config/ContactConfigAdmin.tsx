'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '../../../../i18n/navigation';
import { useProfile, useContactConfig, useUpdateContactConfig } from '../../../lib/hooks';
import { Mail, Save, Info } from 'lucide-react';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: 6,
};

export default function ContactConfigAdmin({ embedded }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: config, isLoading: configLoading } = useContactConfig();
  const update = useUpdateContactConfig();

  const [recipientEmail, setRecipientEmail] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [saved, setSaved] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (!embedded && mounted && !profileLoading && (!profile || !isAdmin)) {
      router.push('/');
    }
  }, [embedded, mounted, profileLoading, profile, isAdmin, router]);

  // Pre-fill when config loads
  useEffect(() => {
    if (config) {
      setRecipientEmail(config.recipientEmail ?? '');
      setSubjectTemplate(config.subjectTemplate ?? '');
      setMessageTemplate(config.messageTemplate ?? '');
    }
  }, [config]);

  if (!embedded && !mounted) return null;

  if (!embedded && (profileLoading || configLoading)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando…</p>
      </div>
    );
  }

  if (!profile || !isAdmin) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    update.mutate(
      {
        recipientEmail,
        subjectTemplate: subjectTemplate || undefined,
        messageTemplate: messageTemplate || undefined,
      },
      { onSuccess: () => setSaved(true) }
    );
  };

  const content = (
    <>
      {!embedded && (
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
            ADMINISTRACIÓN
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 300, marginBottom: 8 }}>
            Configuración de <em style={{ fontStyle: 'italic', color: 'var(--accent-light)' }}>contacto</em>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Define el correo destinatario y las plantillas para las solicitudes de contacto.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Recipient email */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Mail size={16} color="var(--accent)" />
            <p style={{ fontSize: 13, fontWeight: 600 }}>Correo destinatario</p>
          </div>
          <div>
            <label style={labelStyle}>Dirección de correo</label>
            <input
              type="email"
              required
              className="field"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              style={{ fontSize: 13 }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              Todas las solicitudes de contacto y notificaciones se enviarán a esta dirección.
            </p>
          </div>
        </div>

        {/* Templates */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Info size={16} color="var(--accent)" />
            <p style={{ fontSize: 13, fontWeight: 600 }}>Plantillas de correo (opcional)</p>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Puedes usar variables como <code style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4 }}>{'{{name}}'}</code>, <code style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4 }}>{'{{email}}'}</code>, <code style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '1px 6px', borderRadius: 4 }}>{'{{message}}'}</code>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Plantilla de asunto</label>
              <input
                type="text"
                className="field"
                value={subjectTemplate}
                onChange={(e) => setSubjectTemplate(e.target.value)}
                placeholder="Nueva solicitud de {{name}}"
                style={{ fontSize: 13 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Plantilla de mensaje</label>
              <textarea
                className="field"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={6}
                placeholder="Has recibido una solicitud de contacto de {{name}} ({{email}}):\n\n{{message}}"
                style={{ fontSize: 13, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
          </div>
        </div>

        {update.isError && (
          <p style={{ fontSize: 13, color: 'var(--status-sold)' }}>
            Error al guardar: {(update.error as Error).message}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={update.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '10px 20px' }}
          >
            <Save size={14} />
            {update.isPending ? 'Guardando…' : 'Guardar configuración'}
          </button>
          {saved && <span style={{ fontSize: 13, color: 'var(--status-active)' }}>¡Configuración guardada!</span>}
        </div>
      </form>
    </>
  );

  return embedded ? content : (
    <div className="container-wide" style={{ padding: '48px 24px 80px', flex: 1 }}>
      {content}
    </div>
  );
}
