'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePasswordResetRequest } from '../../lib/hooks';
import { CheckCircle, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordForm() {
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
      <div className="text-center py-2">
        <CheckCircle size={44} color="var(--color-success)" className="mx-auto mb-4 block" />
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          Revisa tu correo. Si existe una cuenta asociada, recibirás las instrucciones en breve.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 mt-6 text-[13px] text-primary no-underline"
        >
          Iniciar sesión <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
          Correo electrónico
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Mail size={15} />
          </span>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            disabled={request.isPending}
            className="h-10 pl-9"
          />
        </div>
      </div>

      {request.isError && (
        <div className="px-3.5 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-[13px] text-destructive">
          Error al enviar. Intenta de nuevo.
        </div>
      )}

      <Button type="submit" disabled={request.isPending} className="w-full h-11 mt-1">
        {request.isPending ? 'Enviando…' : 'Enviar instrucciones'}
      </Button>

      <div className="text-center">
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground no-underline hover:text-foreground transition-colors">
          <ArrowLeft size={13} /> Iniciar sesión
        </Link>
      </div>
    </form>
  );
}
