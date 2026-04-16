'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { auth, setTokens } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';

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
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Nombre completo</label>
        <input type="text" required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Tu nombre" disabled={loading} />
      </div>
      <div>
        <label style={labelStyle}>Correo electrónico</label>
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="tu@correo.com" disabled={loading} />
      </div>
      <div>
        <label style={labelStyle}>Contraseña</label>
        <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" placeholder="Mín. 8 caracteres" disabled={loading} />
        {strength && (
          <div style={{ marginTop: 8 }}>
            <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(strength.score / 4) * 100}%`, background: strength.color, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
            </div>
            <p style={{ fontSize: 11, color: strength.color, marginTop: 4 }}>{strength.label}</p>
          </div>
        )}
      </div>
      {error && (
        <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--color-error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--color-error)' }}>
          {error}
        </div>
      )}
      <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4, padding: '13px' }}>
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>Al registrarte aceptas nuestros términos de servicio y política de privacidad.</p>
    </form>
  );
}
