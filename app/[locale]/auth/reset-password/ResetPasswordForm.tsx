'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '../../../../i18n/navigation';
import { usePasswordResetConfirm } from '../../../lib/hooks';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: 6,
};

export default function ResetPasswordForm() {
  const t = useTranslations('auth');
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
      setValidationError(t('passwordsNoMatch'));
      return;
    }
    if (newPassword.length < 8) {
      setValidationError(t('pwMinLength'));
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
          {t('resetPasswordSuccess')}
        </p>
        <Link href="/auth/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 24, padding: '10px 24px' }}>
          {t('signInBtn')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Email — pre-filled from query param, editable in case it's missing */}
      <div>
        <label style={labelStyle}>{t('emailLabel')}</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder={t('emailPlaceholder')}
          disabled={confirm.isPending}
        />
      </div>

      {/* Token */}
      <div>
        <label style={labelStyle}>{t('tokenLabel')}</label>
        <input
          type="text"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="field"
          placeholder={t('tokenPlaceholder')}
          disabled={confirm.isPending}
          style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
        />
      </div>

      {/* New password */}
      <div>
        <label style={labelStyle}>{t('newPasswordLabel')}</label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="field"
            placeholder={t('newPasswordPlaceholder')}
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

      {/* Confirm password */}
      <div>
        <label style={labelStyle}>{t('confirmPasswordLabel')}</label>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="field"
          placeholder={t('confirmPasswordPlaceholder')}
          disabled={confirm.isPending}
        />
      </div>

      {(validationError || confirm.isError) && (
        <div style={{ padding: '10px 14px', background: 'color-mix(in srgb, var(--color-error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)', borderRadius: 8, fontSize: 13, color: 'var(--color-error)' }}>
          {validationError || t('resetPasswordFailed')}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={confirm.isPending} style={{ width: '100%', marginTop: 4, padding: '13px' }}>
        {confirm.isPending ? t('resetPasswordSaving') : t('resetPasswordBtn')}
      </button>

      <div style={{ textAlign: 'center' }}>
        <Link href="/auth/login" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← {t('signInLink')}
        </Link>
      </div>
    </form>
  );
}
