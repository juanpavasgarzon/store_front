'use client';

import { useState, useEffect } from 'react';
import { useAdminUsers, useSetUserActive, useSetUserRole, useDeleteUser, useProfile, useDebounce } from '../../lib/hooks';
import type { UserResponse } from '../../lib/types/users';
import { UserCheck, UserX, Trash2, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';
import { sileo } from 'sileo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const ROLES = ['user', 'admin', 'owner'] as const;
type Role = (typeof ROLES)[number];

const roleStyle: Record<Role, { text: string; bg: string; border: string }> = {
  user:  { text: 'var(--text-muted)',  bg: 'transparent',                                      border: 'var(--border-light)'                               },
  admin: { text: '#9A8C7C',            bg: 'color-mix(in srgb, #9A8C7C 12%, transparent)',     border: 'color-mix(in srgb, #9A8C7C 30%, transparent)'     },
  owner: { text: '#C87D38',            bg: 'color-mix(in srgb, #C87D38 12%, transparent)',     border: 'color-mix(in srgb, #C87D38 30%, transparent)'     },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function UserRow({
  user,
  currentUserId,
  onChangeRole,
  onToggleActive,
  onDelete,
}: {
  user: UserResponse;
  currentUserId?: string;
  onChangeRole: (userId: string, userName: string, newRole: string) => void;
  onToggleActive: (userId: string, userName: string, activate: boolean) => void;
  onDelete: (userId: string, userName: string) => void;
}) {
  const isSelf = user.id === currentUserId;

  return (
    <Card className={isSelf ? 'opacity-80' : ''}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <UserAvatar name={user.name} size={40} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-[14px] font-medium text-foreground">{user.name}</p>
            {isSelf && (
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 bg-primary/10 font-semibold tracking-[0.06em]">
                TÚ
              </Badge>
            )}
            {!user.isActive && (
              <Badge variant="outline" className="text-[10px] text-[#CC6E6E] border-[#CC6E6E]/30 bg-[color-mix(in_srgb,#CC6E6E_15%,transparent)] font-semibold">
                INACTIVO
              </Badge>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground">{user.email}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Registro: {formatDate(user.createdAt)}</p>
        </div>

        {/* Role pills */}
        <div className="flex gap-1 shrink-0" aria-label="Rol del usuario">
          {ROLES.map((r) => {
            const active = r === user.role;
            const s = roleStyle[r];
            return (
              <button
                key={r}
                disabled={isSelf || active}
                onClick={() => onChangeRole(user.id, user.name, r)}
                className="h-9 px-2.5 rounded-md text-[11px] font-semibold tracking-[0.05em] uppercase transition-all duration-150 border disabled:cursor-default"
                style={{
                  color: active ? s.text : 'var(--text-muted)',
                  background: active ? s.bg : 'transparent',
                  borderColor: active ? s.border : 'var(--border)',
                  cursor: isSelf || active ? 'default' : 'pointer',
                  opacity: isSelf ? 0.45 : 1,
                }}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center shrink-0">
          <Button
            variant="ghost"
            size="sm"
            disabled={isSelf}
            title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
            onClick={() => onToggleActive(user.id, user.name, !user.isActive)}
            className="flex items-center gap-1 text-[12px]"
            style={{ color: user.isActive ? '#6ECC96' : '#CC6E6E' }}
          >
            {user.isActive ? <UserCheck size={14} /> : <UserX size={14} />}
            {user.isActive ? 'Activo' : 'Inactivo'}
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            title="Eliminar usuario"
            disabled={isSelf}
            onClick={() => onDelete(user.id, user.name)}
            className="text-[#CC6E6E] hover:text-[#CC6E6E] hover:bg-[color-mix(in_srgb,#CC6E6E_10%,transparent)] disabled:opacity-30"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

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

  const handleChangeRole = (userId: string, userName: string, newRole: string) => {
    sileo.action({
      title: `¿Cambiar rol de "${userName}"?`,
      description: `El nuevo rol será: ${newRole}.`,
      button: {
        title: 'Cambiar rol',
        onClick: () => setRole.mutate({ id: userId, role: newRole }),
      },
    });
  };

  const handleToggleActive = (userId: string, userName: string, activate: boolean) => {
    sileo.action({
      title: activate ? `¿Activar a "${userName}"?` : `¿Desactivar a "${userName}"?`,
      description: activate
        ? 'El usuario recuperará acceso a la plataforma.'
        : 'El usuario no podrá iniciar sesión hasta que sea reactivado.',
      button: {
        title: activate ? 'Activar' : 'Desactivar',
        onClick: () => setActive.mutate({ id: userId, isActive: activate }),
      },
    });
  };

  const handleDelete = (userId: string, userName: string) => {
    sileo.error({
      title: `¿Eliminar a "${userName}"?`,
      description: 'Esta acción es irreversible. El usuario perderá acceso permanentemente.',
      button: {
        title: 'Eliminar',
        onClick: () => deleteUser.mutate(userId),
      },
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
          <p className="text-[11px] tracking-[0.14em] uppercase text-primary mb-2 font-semibold">
            ADMINISTRACIÓN
          </p>
          <h1 className="font-light mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
            Gestión de <em className="italic" style={{ color: 'var(--accent-light)' }}>usuarios</em>
          </h1>
          <p className="text-muted-foreground text-[14px]">
            {isLoading ? 'Cargando…' : `${users.length} usuario${users.length !== 1 ? 's' : ''} en esta página`}
          </p>
        </div>
      )}

      <div className="relative max-w-[360px] mb-6">
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
    <div className="container-wide py-12 pb-20 flex-1 px-6">
      {content}
    </div>
  );
}
