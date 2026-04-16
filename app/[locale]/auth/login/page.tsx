import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Link } from '../../../../i18n/navigation';
import LoginForm from './LoginForm';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('signInBtn') };
}

export default async function LoginPage() {
  const t = await getTranslations('auth');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: `radial-gradient(ellipse 70% 50% at 30% 60%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)` }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--text-primary)', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--accent)' }}>◆</span> Tienda
          </Link>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {t('signInEyebrow')}
          </p>
        </div>

        <div className="animate-fade-up" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '36px 32px' }}>
          <Suspense fallback={<div style={{ height: 200 }} />}>
            <LoginForm />
          </Suspense>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {t('noAccount')}{' '}
              <Link href="/auth/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{t('createLink')}</Link>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>{t('backToMarket')}</Link>
        </div>
      </div>
    </div>
  );
}
