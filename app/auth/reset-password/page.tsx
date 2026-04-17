import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ResetPasswordForm from './ResetPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Crear nueva contraseña' };

export default async function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10"
      style={{ background: `radial-gradient(ellipse 70% 50% at 30% 60%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)` }}
    >
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="no-underline tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--text-primary)' }}
          >
            <span className="text-primary">◆</span> Pavas Marketplace
          </Link>
          <p className="text-[11px] text-muted-foreground mt-1.5 tracking-[0.1em] uppercase">
            Nueva contraseña
          </p>
        </div>

        <div className="animate-fade-up bg-card border border-border rounded-2xl px-8 py-9">
          <h1
            className="mb-2"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400 }}
          >
            Crear nueva contraseña
          </h1>
          <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
            Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
          </p>
          <Suspense fallback={<div className="h-[280px]" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <div className="text-center mt-5">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground no-underline hover:text-foreground transition-colors">
            <ArrowLeft size={13} /> Volver al mercado
          </Link>
        </div>
      </div>
    </div>
  );
}
