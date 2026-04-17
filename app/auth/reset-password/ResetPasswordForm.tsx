'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePasswordResetConfirm } from '../../lib/hooks';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import PasswordInput from '../../components/PasswordInput';

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const emailParam = params.get('email') ?? '';
  const tokenParam = params.get('token') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);

  const confirm = usePasswordResetConfirm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (newPassword !== confirmPassword) {
      setValidationError('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      setValidationError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    confirm.mutate({ email, token, newPassword }, {
      onSuccess: () => setSuccess(true),
    });
  };

  if (success) {
    return (
      <div className="text-center py-2">
        <CheckCircle size={44} color="var(--color-success)" className="mx-auto mb-4 block" />
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          ¡Contraseña actualizada! Ahora puedes iniciar sesión.
        </p>
        <Link href="/auth/login" className={cn(buttonVariants(), 'mt-6 inline-flex')}>
          Iniciar sesión
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
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          disabled={confirm.isPending}
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="token" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
          Código de verificación
        </Label>
        <Input
          id="token"
          type="text"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Código recibido por correo"
          disabled={confirm.isPending}
          className="h-10 font-mono tracking-[0.05em]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
          Nueva contraseña
        </Label>
        <PasswordInput
          id="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mín. 8 caracteres"
          disabled={confirm.isPending}
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
          Confirmar contraseña
        </Label>
        <PasswordInput
          id="confirm-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite tu nueva contraseña"
          disabled={confirm.isPending}
          className="h-10"
        />
      </div>

      {(validationError || confirm.isError) && (
        <div className="px-3.5 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-[13px] text-destructive">
          {validationError || 'Error al restablecer. El código puede haber expirado.'}
        </div>
      )}

      <Button type="submit" disabled={confirm.isPending} className="w-full h-11 mt-1">
        {confirm.isPending ? 'Guardando…' : 'Cambiar contraseña'}
      </Button>

      <div className="text-center">
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground no-underline hover:text-foreground transition-colors">
          <ArrowLeft size={13} /> Iniciar sesión
        </Link>
      </div>
    </form>
  );
}
