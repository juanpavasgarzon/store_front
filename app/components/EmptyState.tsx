'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[38vh] gap-6 text-center px-6 py-[60px]">
      {icon && (
        <div className="w-18 h-18 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-light)] flex items-center justify-center text-muted-foreground"
          style={{ width: 72, height: 72 }}>
          {icon}
        </div>
      )}

      <div>
        <p
          className="text-foreground font-light leading-tight mb-2"
          style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}
        >
          {title}
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground max-w-[360px] mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        action.onClick || !action.href ? (
          <button onClick={action.onClick} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-1')}>
            {action.label}
          </button>
        ) : (
          <Link href={action.href} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-1')}>
            {action.label}
          </Link>
        )
      )}
    </div>
  );
}
