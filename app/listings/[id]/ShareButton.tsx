'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShareButton({ title }: { title: string }) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
      setTimeout(() => setState('idle'), 2500);
    } catch {}
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="w-full gap-2 mb-3"
    >
      {state === 'copied' ? <Check size={14} /> : <Share2 size={14} />}
      {state === 'copied' ? 'Enlace copiado' : 'Compartir'}
    </Button>
  );
}
