'use client';

import type { UserResponse } from '../../../lib/types/users';
import UserAvatar from '../../../components/UserAvatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { UserCheck, UserX, Trash2 } from 'lucide-react';

const ROLES = ['user', 'admin', 'owner'] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  user:  'Usuario',
  admin: 'Admin',
  owner: 'Propietario',
};

const roleStyle: Record<Role, { text: string; bg: string; border: string }> = {
  user:  { text: 'var(--text-muted)',  bg: 'transparent',                                   border: 'var(--border-light)'                               },
  admin: { text: '#9A8C7C',            bg: 'color-mix(in srgb, #9A8C7C 12%, transparent)', border: 'color-mix(in srgb, #9A8C7C 30%, transparent)'     },
  owner: { text: '#C87D38',            bg: 'color-mix(in srgb, #C87D38 12%, transparent)', border: 'color-mix(in srgb, #C87D38 30%, transparent)'     },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function UserRow({
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
                {ROLE_LABELS[r]}
              </button>
            );
          })}
        </div>

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
