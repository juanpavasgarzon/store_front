'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { auth, setTokens } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '../../components/PasswordInput';

export default function LoginForm() {
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
      queryClient.setQueryData(queryKeys.profile, {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
      });
      router.push(redirect as '/dashboard');
    } catch {
      setError('Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

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
          disabled={loading}
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <Label htmlFor="password" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
            Contraseña
          </Label>
          <Link href="/auth/forgot-password" className="text-[11px] text-primary no-underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <PasswordInput
          id="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mín. 8 caracteres"
          disabled={loading}
          className="h-10"
        />
      </div>

      {error && (
        <div className="px-3.5 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-[13px] text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full h-11 mt-1">
        {loading ? 'Ingresando…' : 'Iniciar sesión'}
      </Button>
    </form>
  );
}
