import { Suspense } from 'react';
import Link from 'next/link';
import ResetPasswordForm from './ResetPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Crear nueva contraseña' };

export default async function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: `radial-gradient(ellipse 70% 50% at 30% 60%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)` }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--text-primary)', textDecoration: 'none', letterSpacing: '-0.02em' }}>
            <span style={{ color: 'var(--accent)' }}>◆</span> Tienda
          </Link>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Nueva contraseña
          </p>
        </div>

        <div className="animate-fade-up" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '36px 32px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, marginBottom: 8 }}>
            Crear nueva contraseña
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
          </p>
          <Suspense fallback={<div style={{ height: 280 }} />}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>← Volver al mercado</Link>
        </div>
      </div>
    </div>
  );
}
