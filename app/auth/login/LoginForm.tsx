'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { auth, setTokens } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';

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
        <label style={labelStyle}>Correo electrónico</label>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="tu@correo.com" disabled={loading} />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Contraseña</label>
          <Link href="/auth/forgot-password" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" placeholder="Mín. 8 caracteres" disabled={loading} />
      </div>
      {error && (
        <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--color-error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--color-error)' }}>
          {error}
        </div>
      )}
      <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4, padding: '13px' }}>
        {loading ? 'Ingresando…' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
