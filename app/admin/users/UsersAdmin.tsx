'use client';

import { useState, useEffect } from 'react';
import { useAdminUsers, useSetUserActive, useSetUserRole, useDeleteUser, useProfile, useDebounce } from '../../lib/hooks';
import { UserRow } from './components/UserRow';
import { sileo } from 'sileo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, ChevronLeft, Search } from 'lucide-react';

export default function UsersAdmin({ embedded }: { embedded?: boolean } = {}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const [cursor, setCursor] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);

  const setActive = useSetUserActive();
  const setRole = useSetUserRole();
  const deleteUser = useDeleteUser();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  const { data, isLoading } = useAdminUsers(cursor);
  const users = data?.data ?? [];
  const meta = data?.meta;

  const filtered = search.trim()
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  const ROLE_LABELS: Record<string, string> = { user: 'Usuario', admin: 'Admin', owner: 'Propietario' };

  const handleChangeRole = (userId: string, userName: string, newRole: string) => {
    sileo.action({
      title: `¿Cambiar rol de "${userName}"?`,
      description: `El nuevo rol será: ${ROLE_LABELS[newRole] ?? newRole}.`,
      button: { title: 'Cambiar rol', onClick: () => setRole.mutate({ id: userId, role: newRole }) },
    });
  };

  const handleToggleActive = (userId: string, userName: string, activate: boolean) => {
    sileo.action({
      title: activate ? `¿Activar a "${userName}"?` : `¿Desactivar a "${userName}"?`,
      description: activate
        ? 'El usuario recuperará acceso a la plataforma.'
        : 'El usuario no podrá iniciar sesión hasta que sea reactivado.',
      button: { title: activate ? 'Activar' : 'Desactivar', onClick: () => setActive.mutate({ id: userId, isActive: activate }) },
    });
  };

  const handleDelete = (userId: string, userName: string) => {
    sileo.error({
      title: `¿Eliminar a "${userName}"?`,
      description: 'Esta acción es irreversible. El usuario perderá acceso permanentemente.',
      button: { title: 'Eliminar', onClick: () => deleteUser.mutate(userId) },
    });
  };

  if (!mounted) return null;

  if (!embedded && profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!profile || !isAdmin) return null;

  const content = (
    <>
      {!embedded && (
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">ADMINISTRACIÓN</p>
          <h1 className="font-light mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
            Gestión de <em className="italic" style={{ color: 'var(--accent-light)' }}>usuarios</em>
          </h1>
          <p className="text-muted-foreground text-[14px]">
            {isLoading ? 'Cargando…' : `${users.length} usuario${users.length !== 1 ? 's' : ''} en esta página`}
          </p>
        </div>
      )}

      <div className="relative w-full max-w-[360px] mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar por nombre o correo…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 text-[13px] h-9"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-card rounded-xl border border-border opacity-50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-[14px]">
          {searchInput ? 'Sin resultados para esta búsqueda.' : 'No hay usuarios.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              currentUserId={profile.id}
              onChangeRole={handleChangeRole}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {(meta?.hasNextPage || meta?.hasPreviousPage) && !searchInput && (
        <div className="flex gap-3 items-center mt-8 justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPreviousPage}
            onClick={() => setCursor(meta.previousCursor ?? undefined)}
            className="flex items-center gap-1.5"
          >
            <ChevronLeft size={15} /> Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNextPage}
            onClick={() => setCursor(meta.nextCursor ?? undefined)}
            className="flex items-center gap-1.5"
          >
            Siguiente <ChevronRight size={15} />
          </Button>
        </div>
      )}
    </>
  );

  return embedded ? content : (
    <div className="container-wide py-12 pb-20 flex-1 px-6">{content}</div>
  );
}
