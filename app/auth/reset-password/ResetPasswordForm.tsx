'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePasswordResetConfirm } from '../../lib/hooks';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: 6,
};

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const emailParam = params.get('email') ?? '';
  const tokenParam = params.get('token') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <CheckCircle size={44} color='var(--color-success)' style={{ margin: '0 auto 16px', display: 'block' }} />
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          ¡Contraseña actualizada! Ahora puedes iniciar sesión.
        </p>
        <Link href="/auth/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 24, padding: '10px 24px' }}>
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Correo electrónico</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder="tu@correo.com"
          disabled={confirm.isPending}
        />
      </div>

      <div>
        <label style={labelStyle}>Código de verificación</label>
        <input
          type="text"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="field"
          placeholder="Código recibido por correo"
          disabled={confirm.isPending}
          style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
        />
      </div>

      <div>
        <label style={labelStyle}>Nueva contraseña</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="field"
            placeholder="Mín. 8 caracteres"
            disabled={confirm.isPending}
            style={{ paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Confirmar contraseña</label>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="field"
          placeholder="Repite tu nueva contraseña"
          disabled={confirm.isPending}
        />
      </div>

      {(validationError || confirm.isError) && (
        <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--color-error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--color-error)' }}>
          {validationError || 'Error al restablecer. El código puede haber expirado.'}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={confirm.isPending} style={{ width: '100%', marginTop: 4, padding: '13px' }}>
        {confirm.isPending ? 'Guardando…' : 'Cambiar contraseña'}
      </button>

      <div style={{ textAlign: 'center' }}>
        <Link href="/auth/login" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Iniciar sesión
        </Link>
      </div>
    </form>
  );
}
