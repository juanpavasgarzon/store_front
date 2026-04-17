'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { auth, setTokens } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import PasswordInput from '../../components/PasswordInput';

export default function RegisterForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setLoading(true); setError('');
    try {
      const res = await auth.register(email, password, name);
      setTokens(res.accessToken, res.refreshToken);
      queryClient.setQueryData(queryKeys.profile, {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role,
      });
      router.push('/dashboard');
    } catch {
      setError('Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password.length) { return null; }
    let score = 0;
    if (password.length >= 8) { score++; }
    if (/[A-Z]/.test(password)) { score++; }
    if (/[0-9]/.test(password)) { score++; }
    if (/[^A-Za-z0-9]/.test(password)) { score++; }
    const labels = ['Débil', 'Regular', 'Buena', 'Fuerte'];
    const colors = ['#CC6E6E', '#CC9E6E', '#A4C46E', '#6ECC96'];
    return { label: labels[score - 1] ?? 'Muy débil', color: colors[score - 1] ?? '#CC6E6E', score };
  };

  const strength = passwordStrength();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
          Nombre completo
        </Label>
        <Input
          id="name"
          type="text"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          disabled={loading}
          className="h-10"
        />
      </div>

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
        <Label htmlFor="password" className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground">
          Contraseña
        </Label>
        <PasswordInput
          id="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mín. 8 caracteres"
          disabled={loading}
          className="h-10"
        />
        {strength && (
          <div className="mt-1">
            <div className="h-[3px] bg-border rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${(strength.score / 4) * 100}%`,
                  background: strength.color,
                }}
              />
            </div>
            <p className="text-[11px] mt-1" style={{ color: strength.color }}>
              {strength.label}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className={cn('px-3.5 py-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-[13px] text-destructive')}>
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full h-11 mt-1">
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Al registrarte aceptas nuestros términos de servicio y política de privacidad.
      </p>
    </form>
  );
}
