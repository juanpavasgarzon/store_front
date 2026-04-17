'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useProfile, useUpdateProfile } from '../../lib/hooks';
import { clearTokens, getRefreshToken } from '../../lib/api/client';
import { auth } from '../../lib/api/auth';

interface ProfileFormState {
  name: string;
  phone: string;
  city: string;
}

export function useProfileActions() {
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

  const handleEdit = () => {
    if (!profile) return;
    setEditing(true);
    setForm({ name: profile.name, phone: profile.phone ?? '', city: profile.city ?? '' });
    setMsg('');
  };

  const handleSave = () => {
    if (!profile) return;
    setMsg('');
    updateProfile.mutate(
      { name: form.name || profile.name, phone: form.phone || null, city: form.city || null },
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
    if (refreshToken) auth.logout(refreshToken).catch(() => undefined);
    router.push('/listings');
  };

  return {
    mounted, profile, isLoading,
    editing, setEditing,
    form, setForm,
    msg, setMsg,
    isPending: updateProfile.isPending,
    handleEdit, handleSave, handleLogout,
  };
}
