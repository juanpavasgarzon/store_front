'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile, useUpdateProfile } from '../lib/hooks';
import { clearTokens, getRefreshToken } from '../lib/api/client';
import { auth } from '../lib/api/auth';
import { sileo } from 'sileo';
import UserAvatar from '../components/UserAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Mail, Hash, Phone, MapPin,
  Pencil, Save, X, LogOut,
} from 'lucide-react';

interface ProfileFormState {
  name: string;
  phone: string;
  city: string;
}

const labelClass = 'text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground';

const roleColors: Record<string, string> = {
  user:  'var(--text-muted)',
  admin: '#9A8C7C',
  owner: '#C87D38',
};

export default function ProfileClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileFormState>({ name: '', phone: '', city: '' });
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
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
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
      city: profile.city ?? '',
    });
    setMsg('');
  };

  const handleSave = () => {
    setMsg('');
    updateProfile.mutate(
      {
        name: form.name || profile.name,
        phone: form.phone || null,
        city: form.city || null,
      },
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

  const infoRows = [
    { icon: <Hash size={13} />, label: 'ID de cuenta', value: profile.id },
    { icon: <Mail size={13} />, label: 'Correo electrónico', value: profile.email },
    ...(profile.phone ? [{ icon: <Phone size={13} />, label: 'Teléfono', value: profile.phone }] : []),
    ...(profile.city ? [{ icon: <MapPin size={13} />, label: 'Ciudad', value: profile.city }] : []),
  ];

  return (
    <div className="container-wide py-12 pb-20 flex-1 px-6">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
          CUENTA
        </p>
        <h1 className="font-light" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
          Mi <em className="italic" style={{ color: 'var(--accent-light)' }}>perfil</em>
        </h1>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr]">

        {/* ── Left: identity card ────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden">
            {/* Banner */}
            <div
              className="h-24 relative shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent-dim), color-mix(in srgb, var(--accent) 40%, var(--bg-elevated)))' }}
            >
              <div
                className="absolute -bottom-9 left-6 border-[3px] border-card overflow-hidden"
                style={{ borderRadius: 16, width: 72, height: 72 }}
              >
                <UserAvatar name={profile.name} size={72} />
              </div>
            </div>

            <CardContent className="pt-14 pb-6 px-6">
              <h2 className="font-normal leading-tight mb-0.5" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
                {profile.name}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-0.5"
                  style={{ color: roleColors[profile.role] ?? 'var(--text-muted)', borderColor: `color-mix(in srgb, ${roleColors[profile.role] ?? 'currentColor'} 30%, transparent)` }}
                >
                  {profile.role}
                </Badge>
              </div>

              {msg && (
                <p className={cn('text-[12px] mb-3', msg.includes('!') ? 'text-[#6ECC96]' : 'text-destructive')}>
                  {msg}
                </p>
              )}

              <Separator className="mb-4" />

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {profile.email}
              </p>
            </CardContent>
          </Card>

          {/* Logout */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              sileo.action({
                title: '¿Cerrar sesión?',
                description: 'Se cerrará tu sesión en este dispositivo.',
                button: { title: 'Cerrar sesión', onClick: handleLogout },
              })
            }
            className="w-full justify-start text-[13px]"
          >
            <LogOut size={14} /> Cerrar sesión
          </Button>
        </div>

        {/* ── Right: info / edit form ────────────────────────────────── */}
        <Card>
          <CardContent className="px-8 py-7">
            {editing ? (
              /* ── Edit form ── */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-normal" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
                    Editar información
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditing(false); setMsg(''); }}
                    className="flex items-center gap-1.5 text-muted-foreground"
                  >
                    <X size={13} /> Cancelar
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className={labelClass}>Nombre</Label>
                    <Input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      minLength={2}
                      maxLength={120}
                      className="h-10 text-[13px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className={labelClass}>Ciudad</Label>
                    <Input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Medellín"
                      className="h-10 text-[13px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className={labelClass}>Teléfono</Label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+57 300 000 0000"
                      className="h-10 text-[13px]"
                    />
                  </div>

                </div>

                <div className="flex gap-2 mt-7">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                    className="flex items-center gap-1.5"
                  >
                    <Save size={12} />
                    {updateProfile.isPending ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditing(false); setMsg(''); }}
                    className="flex items-center gap-1.5"
                  >
                    <X size={12} /> Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Info view ── */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-normal" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
                    Información personal
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="flex items-center gap-1.5 text-[11px]"
                  >
                    <Pencil size={11} /> Editar perfil
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
                  {infoRows.map(({ icon, label, value }, idx) => (
                    <div key={label}>
                      <div className="py-4">
                        <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-1 flex items-center gap-1.5">
                          {icon} {label}
                        </p>
                        <p className="text-[14px] text-foreground break-all">{value}</p>
                      </div>
                      {idx < infoRows.length - 1 && (
                        <Separator className="sm:hidden" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
