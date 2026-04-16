'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile, useUpdateProfile } from '../lib/hooks';
import { clearTokens, getRefreshToken } from '../lib/api/client';
import { auth } from '../lib/api/auth';
import UserAvatar from '../components/UserAvatar';
import {
  Mail, Shield, Hash, Phone, MessageSquare, MapPin,
  Pencil, Save, X, LogOut,
} from 'lucide-react';

interface ProfileFormState {
  name: string;
  phone: string;
  whatsapp: string;
  city: string;
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: 6,
  };
}

export default function ProfileClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileFormState>({ name: '', phone: '', whatsapp: '', city: '' });
  const [msg, setMsg] = useState('');

  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isLoading && !profile) {
      router.push('/auth/login?redirect=/profile');
    }
  }, [mounted, isLoading, profile, router]);

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>Cargando…</p>
      </div>
    );
  }

  if (!profile) return null;

  const handleEdit = () => {
    setEditing(true);
    setForm({
      name: profile.name,
      phone: profile.phone ?? '',
      whatsapp: profile.whatsapp ?? '',
      city: profile.city ?? '',
    });
    setMsg('');
  };

  const handleSave = () => {
    setMsg('');
    updateProfile.mutate(
      { name: form.name || profile.name, phone: form.phone || null, whatsapp: form.whatsapp || null, city: form.city || null },
      {
        onSuccess: () => { setMsg('¡Perfil actualizado!'); setEditing(false); },
        onError: (e) => setMsg((e as Error).message),
      },
    );
  };

  const handleLogout = () => {
    const refreshToken = getRefreshToken();
    clearTokens();
    queryClient.clear();
    if (refreshToken) {
      auth.logout(refreshToken).catch(() => undefined);
    }
    router.push('/listings');
  };

  const field = (key: keyof ProfileFormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
    className: 'field' as const,
    style: { fontSize: 14, width: '100%', maxWidth: 340 },
  });

  const infoRows = [
    { icon: <Mail size={11} />, label: 'Correo electrónico', value: profile.email },
    { icon: <Shield size={11} />, label: 'Rol', value: profile.role.charAt(0).toUpperCase() + profile.role.slice(1) },
    { icon: <Hash size={11} />, label: 'ID', value: profile.id.slice(0, 8) + '…' },
    ...(profile.phone ? [{ icon: <Phone size={11} />, label: 'Teléfono', value: profile.phone }] : []),
    ...(profile.whatsapp ? [{ icon: <MessageSquare size={11} />, label: 'WhatsApp', value: profile.whatsapp }] : []),
    ...(profile.city ? [{ icon: <MapPin size={11} />, label: 'Ciudad', value: profile.city }] : []),
  ];

  return (
    <div className="container-wide" style={{ padding: '48px 24px 80px', flex: 1 }}>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
          CUENTA
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 300 }}>
          Mi <em style={{ fontStyle: 'italic', color: 'var(--accent-light)' }}>perfil</em>
        </h1>
      </div>

      <div style={{ maxWidth: 640 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Banner */}
          <div style={{
            height: 90,
            background: 'linear-gradient(135deg, var(--accent-dim), color-mix(in srgb, var(--accent) 40%, var(--bg-elevated)))',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', bottom: -34, left: 32,
              width: 68, height: 68, borderRadius: 14,
              border: '3px solid var(--bg-surface)',
              overflow: 'hidden',
            }}>
              <UserAvatar name={profile.name} size={68} />
            </div>
          </div>

          <div style={{ padding: '48px 32px 32px' }}>
            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <div>
                {!editing && (
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 400, marginBottom: 2 }}>
                    {profile.name}
                  </h2>
                )}
                {msg && (
                  <p style={{ fontSize: 12, marginTop: 4, color: msg.includes('!') ? '#6ECC96' : '#CC6E6E' }}>{msg}</p>
                )}
              </div>
              {!editing && (
                <button
                  className="btn btn-outline"
                  style={{ padding: '5px 14px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}
                  onClick={handleEdit}
                >
                  <Pencil size={11} /> Editar perfil
                </button>
              )}
            </div>

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle()}>Nombre</label>
                  <input type="text" {...field('name')} minLength={2} maxLength={120} />
                </div>
                <div>
                  <label style={labelStyle()}>Teléfono</label>
                  <input type="tel" {...field('phone')} placeholder="+57 300 000 0000" />
                </div>
                <div>
                  <label style={labelStyle()}>WhatsApp</label>
                  <input type="tel" {...field('whatsapp')} placeholder="+57 300 000 0000" />
                </div>
                <div>
                  <label style={labelStyle()}>Ciudad</label>
                  <input type="text" {...field('city')} placeholder="Medellín" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '7px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                  >
                    <Save size={12} />
                    {updateProfile.isPending ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '7px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}
                    onClick={() => { setEditing(false); setMsg(''); }}
                  >
                    <X size={12} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {infoRows.map(({ icon, label, value }) => (
                  <div key={label} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {icon} {label}
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <button
                className="btn btn-ghost"
                onClick={handleLogout}
                style={{ fontSize: 13, color: '#CC6E6E', padding: '7px 0', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
