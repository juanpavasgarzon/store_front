'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '../../../../i18n/navigation';
import { usePasswordResetRequest } from '../../../lib/hooks';
import { CheckCircle, Mail } from 'lucide-react';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: 6,
};

export default function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const request = usePasswordResetRequest();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    request.mutate(email, {
      onSuccess: () => setSent(true),
    });
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <CheckCircle size={44} color='var(--color-success)' style={{ margin: '0 auto 16px', display: 'block' }} />
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {t('forgotPasswordSent')}
        </p>
        <Link href="/auth/login" style={{ display: 'inline-block', marginTop: 24, fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
          {t('signInLink')} →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>{t('emailLabel')}</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
            <Mail size={15} />
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder={t('emailPlaceholder')}
            disabled={request.isPending}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {request.isError && (
        <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--color-error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--color-error)' }}>
          {t('forgotPasswordFailed')}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={request.isPending} style={{ width: '100%', marginTop: 4, padding: '13px' }}>
        {request.isPending ? t('forgotPasswordSending') : t('forgotPasswordBtn')}
      </button>

      <div style={{ textAlign: 'center' }}>
        <Link href="/auth/login" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← {t('signInLink')}
        </Link>
      </div>
    </form>
  );
}
