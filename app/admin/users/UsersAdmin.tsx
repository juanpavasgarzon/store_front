'use client';

import { useState, useEffect } from 'react';
import { useAdminUsers, useSetUserActive, useSetUserRole, useDeleteUser, useProfile, useDebounce } from '../../lib/hooks';
import type { UserResponse } from '../../lib/types/users';
import { UserCheck, UserX, Shield, Trash2, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';
import ConfirmModal from '../../components/ConfirmModal';

const ROLES = ['user', 'admin', 'owner'];

const roleColors: Record<string, string> = {
  user: 'var(--text-muted)',
  admin: '#9A8C7C',
  owner: '#C87D38',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface PendingAction {
  type: 'role' | 'active' | 'delete';
  userId: string;
  userName: string;
  value?: string | boolean;
}

function getModalProps(action: PendingAction): { title: string; description: string; confirmLabel: string; danger: boolean } {
  if (action.type === 'delete') {
    return {
      title: `¿Eliminar a "${action.userName}"?`,
      description: 'Esta acción es irreversible. El usuario perderá acceso permanentemente.',
      confirmLabel: 'Eliminar',
      danger: true,
    };
  }
  if (action.type === 'active') {
    const activating = action.value as boolean;
    return {
      title: activating ? `¿Activar a "${action.userName}"?` : `¿Desactivar a "${action.userName}"?`,
      description: activating
        ? 'El usuario recuperará acceso a la plataforma.'
        : 'El usuario no podrá iniciar sesión hasta que sea reactivado.',
      confirmLabel: activating ? 'Activar' : 'Desactivar',
      danger: !activating,
    };
  }
  return {
    title: `¿Cambiar rol de "${action.userName}"?`,
    description: `El nuevo rol será: ${action.value as string}.`,
    confirmLabel: 'Cambiar rol',
    danger: false,
  };
}

function UserRow({
  user,
  currentUserId,
  onAction,
}: {
  user: UserResponse;
  currentUserId?: string;
  onAction: (action: PendingAction) => void;
}) {
  const isSelf = user.id === currentUserId;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
      background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12,
      flexWrap: 'wrap', opacity: isSelf ? 0.85 : 1,
    }}>
      <UserAvatar name={user.name} size={40} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</p>
          {isSelf && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-elevated)', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.06em' }}>
              TÚ
            </span>
          )}
          {!user.isActive && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'color-mix(in srgb, #CC6E6E 15%, transparent)', color: '#CC6E6E', fontWeight: 600 }}>
              INACTIVO
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Registro: {formatDate(user.createdAt)}</p>
      </div>

      {/* Role select */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Shield
          size={11}
          style={{ position: 'absolute', left: 10, color: roleColors[user.role] ?? 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }}
        />
        <select
          className="field"
          value={user.role}
          disabled={isSelf}
          style={{ fontSize: 12, padding: '5px 10px 5px 28px', minWidth: 100, color: roleColors[user.role] ?? 'var(--text-muted)', fontWeight: 600, cursor: isSelf ? 'default' : 'pointer' }}
          onChange={(e) => {
            if (e.target.value !== user.role) {
              onAction({ type: 'role', userId: user.id, userName: user.name, value: e.target.value });
            }
          }}
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button
          className="btn btn-ghost"
          disabled={isSelf}
          title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
          onClick={() => onAction({ type: 'active', userId: user.id, userName: user.name, value: !user.isActive })}
          style={{ padding: '6px 10px', fontSize: 12, color: user.isActive ? '#6ECC96' : '#CC6E6E', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {user.isActive ? <UserCheck size={14} /> : <UserX size={14} />}
          {user.isActive ? 'Activo' : 'Inactivo'}
        </button>

        {!isSelf && (
          <button
            title="Eliminar usuario"
            onClick={() => onAction({ type: 'delete', userId: user.id, userName: user.name })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CC6E6E', display: 'flex', alignItems: 'center', padding: '6px' }}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function UsersAdmin({ embedded }: { embedded?: boolean } = {}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const [cursor, setCursor] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

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

  const handleConfirm = () => {
    if (!pendingAction) return;
    const { type, userId, value } = pendingAction;
    if (type === 'delete') deleteUser.mutate(userId);
    else if (type === 'active') setActive.mutate({ id: userId, isActive: value as boolean });
    else if (type === 'role') setRole.mutate({ id: userId, role: value as string });
    setPendingAction(null);
  };

  const isPending = setActive.isPending || setRole.isPending || deleteUser.isPending;

  if (!mounted) return null;

  if (!embedded && profileLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando…</p>
      </div>
    );
  }

  if (!profile || !isAdmin) return null;

  const content = (
    <>
      {pendingAction && (
        <ConfirmModal
          open={true}
          {...getModalProps(pendingAction)}
          isPending={isPending}
          onConfirm={handleConfirm}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {!embedded && (
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
            ADMINISTRACIÓN
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 300, marginBottom: 8 }}>
            Gestión de <em style={{ fontStyle: 'italic', color: 'var(--accent-light)' }}>usuarios</em>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {isLoading ? 'Cargando…' : `${users.length} usuario${users.length !== 1 ? 's' : ''} en esta página`}
          </p>
        </div>
      )}

      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 24 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <Search size={15} />
        </span>
        <input
          type="search"
          className="field"
          placeholder="Buscar por nombre o correo…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ paddingLeft: 36, fontSize: 13 }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 80, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {searchInput ? 'Sin resultados para esta búsqueda.' : 'No hay usuarios.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              currentUserId={profile.id}
              onAction={setPendingAction}
            />
          ))}
        </div>
      )}

      {(meta?.hasNextPage || meta?.hasPreviousPage) && !searchInput && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 32, justifyContent: 'center' }}>
          <button
            className="btn btn-outline"
            disabled={!meta.hasPreviousPage}
            onClick={() => setCursor(meta.previousCursor ?? undefined)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <ChevronLeft size={15} /> Anterior
          </button>
          <button
            className="btn btn-outline"
            disabled={!meta.hasNextPage}
            onClick={() => setCursor(meta.nextCursor ?? undefined)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            Siguiente <ChevronRight size={15} />
          </button>
        </div>
      )}
    </>
  );

  return embedded ? content : (
    <div className="container-wide" style={{ padding: '48px 24px 80px', flex: 1 }}>
      {content}
    </div>
  );
}
