'use client';

import Link from 'next/link';
import { useProfile } from '../../lib/hooks';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';

interface EditButtonProps {
  listingId: string;
  ownerId: string;
}

export default function EditButton({ listingId, ownerId }: EditButtonProps) {
  const { data: profile } = useProfile();

  if (!profile || profile.id !== ownerId) return null;

  return (
    <Link
      href={`/listings/${listingId}/edit`}
      className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'w-full justify-center flex items-center gap-1.5 mb-3',
      )}
    >
      <Pencil size={12} /> Editar anuncio
    </Link>
  );
}
