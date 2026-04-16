'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '../../../../i18n/navigation';
import { useProfile, useAdminUsers, useSetUserActive, useSetUserRole, useDeleteUser } from '../../../lib/hooks';
import type { UserResponse } from '../../../lib/types/users';
import { UserCheck, UserX, Shield, Trash2, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import UserAvatar from '../../../components/UserAvatar';

const ROLES = ['user', 'admin', 'owner'];

const roleColors: Record<string, string> = {
  user: 'var(--text-muted)',
  admin: '#9A8C7C',
  owner: '#C87D38',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

function UserRow({ user, currentUserId }: { user: UserResponse; currentUserId?: string }) {
  const setActive = useSetUserActive();
  const setRole = useSetUserRole();
  const deleteUser = useDeleteUser();
  const [editingRole, setEditingRole] = useState(false);

  const isSelf = user.id === currentUserId;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
      background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12,
      flexWrap: 'wrap', opacity: isSelf ? 0.85 : 1,
    }}>
      {/* Avatar + info */}
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

      {/* Role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {editingRole ? (
          <>
            <select
              className="field"
              defaultValue={user.role}
              style={{ fontSize: 12, padding: '5px 10px', minWidth: 90 }}
              onChange={(e) => {
                setRole.mutate({ id: user.id, role: e.target.value });
                setEditingRole(false);
              }}
              disabled={setRole.isPending}
              autoFocus
              onBlur={() => setEditingRole(false)}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </>
        ) : (
          <button
            onClick={() => !isSelf && setEditingRole(true)}
            disabled={isSelf}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6,
              border: '1px solid var(--border-light)', background: 'var(--bg-elevated)',
              color: roleColors[user.role] ?? 'var(--text-muted)', fontSize: 12, fontWeight: 600,
              cursor: isSelf ? 'default' : 'pointer', letterSpacing: '0.04em',
            }}
          >
            <Shield size={11} /> {user.role}
          </button>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <button
          className="btn btn-ghost"
          disabled={setActive.isPending || isSelf}
          title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
          onClick={() => setActive.mutate({ id: user.id, isActive: !user.isActive })}
          style={{ padding: '6px 10px', fontSize: 12, color: user.isActive ? '#6ECC96' : '#CC6E6E', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {user.isActive ? <UserCheck size={14} /> : <UserX size={14} />}
          {user.isActive ? 'Activo' : 'Inactivo'}
        </button>

        {!isSelf && (
          <button
            disabled={deleteUser.isPending}
            title="Eliminar usuario"
            onClick={() => {
              if (confirm(`¿Eliminar al usuario "${user.name}"? Esta acción es irreversible.`)) {
                deleteUser.mutate(user.id);
              }
            }}
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
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: profile, isLoading: profileLoading } = useProfile();
  const [cursor, setCursor] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

  useEffect(() => {
    if (!embedded && mounted && !profileLoading && (!profile || !isAdmin)) {
      router.push('/');
    }
  }, [embedded, mounted, profileLoading, profile, isAdmin, router]);

  const { data, isLoading } = useAdminUsers(cursor);
  const users = data?.data ?? [];
  const meta = data?.meta;

  const filtered = search.trim()
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  if (!embedded && !mounted) return null;

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
      {/* Header */}
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

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 24 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <Search size={15} />
        </span>
        <input
          type="search"
          className="field"
          placeholder="Buscar por nombre o correo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 36, fontSize: 13 }}
        />
      </div>

      {/* User list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 80, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {search ? 'Sin resultados para esta búsqueda.' : 'No hay usuarios.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((user) => (
            <UserRow key={user.id} user={user} currentUserId={profile.id} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(meta?.hasNextPage || meta?.hasPreviousPage) && !search && (
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
