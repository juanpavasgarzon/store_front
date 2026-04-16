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
}

export default function UserAvatar({ name, size = 32 }: Props) {
  const initials = getInitials(name);
  const radius = Math.floor(size * 0.22);
  const fontSize = Math.floor(size * 0.38);

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'var(--accent-dim)',
        color: 'var(--accent-light)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        letterSpacing: 0,
        flexShrink: 0,
        userSelect: 'none',
      }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}
