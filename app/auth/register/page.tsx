import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RegisterForm from './RegisterForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default async function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10"
      style={{ background: `radial-gradient(ellipse 70% 50% at 70% 40%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)` }}
    >
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <Link
            href="/"
            className="no-underline tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--text-primary)' }}
          >
            <span className="text-primary">◆</span> Tienda
          </Link>
          <p className="text-[11px] text-muted-foreground mt-1.5 tracking-[0.1em] uppercase">
            Crea tu cuenta
          </p>
        </div>

        <div className="animate-fade-up bg-card border border-border rounded-2xl px-8 py-9">
          <RegisterForm />
          <div className="mt-6 text-center">
            <p className="text-[13px] text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-primary no-underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
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
