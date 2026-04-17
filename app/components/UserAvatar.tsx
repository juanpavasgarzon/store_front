'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * Derives initials from a full name:
 * "Juan Fernando Pavas Garzón" → "JG" (first word + last word)
 * "María" → "MA"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export default function UserAvatar({ name, size = 32, className }: Props) {
  const initials = getInitials(name);

  return (
    <Avatar
      aria-label={name}
      className={cn(
        'bg-[var(--accent-dim)] text-[var(--accent-light)] font-bold select-none',
        className,
      )}
      style={{ width: size, height: size, borderRadius: Math.floor(size * 0.22) }}
    >
      <AvatarFallback
        className="bg-[var(--accent-dim)] text-[var(--accent-light)] font-bold"
        style={{ fontSize: Math.floor(size * 0.38) }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
