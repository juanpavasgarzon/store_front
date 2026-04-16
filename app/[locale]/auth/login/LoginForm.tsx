'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '../../../../i18n/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { auth, setTokens } from '../../../lib/api';
import { queryKeys } from '../../../lib/queryKeys';

export default function LoginForm() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const redirect = searchParams.get('redirect') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await auth.login(email, password);
      setTokens(res.accessToken, res.refreshToken);
      // Seed the profile cache immediately so the Navbar doesn't need a
      // separate round-trip after redirect.
      queryClient.setQueryData(queryKeys.profile, {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
      });
      router.push(redirect as '/dashboard');
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 6,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>{t('emailLabel')}</label>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder={t('emailPlaceholder')} disabled={loading} />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>{t('passwordLabel')}</label>
          <Link href="/auth/forgot-password" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
            {t('forgotPasswordLink')}
          </Link>
        </div>
        <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" placeholder={t('passwordPlaceholder')} disabled={loading} />
      </div>
      {error && (
        <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--color-error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--color-error)' }}>
          {error}
        </div>
      )}
      <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4, padding: '13px' }}>
        {loading ? t('signingIn') : t('signInBtn')}
      </button>
    </form>
  );
}
