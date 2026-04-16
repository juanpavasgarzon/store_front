'use client';

import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href: string;
    onClick?: () => void;
  };
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '38vh',
        gap: 24,
        textAlign: 'center',
        padding: '60px 24px',
      }}
    >
      {icon && (
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          {icon}
        </div>
      )}

      <div>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 300,
            marginBottom: 8,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-muted)',
              maxWidth: 360,
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        action.onClick ? (
          <button
            onClick={action.onClick}
            className="btn btn-outline"
            style={{ fontSize: 13, marginTop: 4 }}
          >
            {action.label}
          </button>
        ) : (
          <Link
            href={action.href}
            className="btn btn-outline"
            style={{ fontSize: 13, marginTop: 4 }}
          >
            {action.label}
          </Link>
        )
      )}
    </div>
  );
}
