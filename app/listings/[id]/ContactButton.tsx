'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../../lib/api';
import {
  useAddFavorite,
  useRemoveFavorite,
  useMyFavorites,
  useCreateContactRequest,
  useMyContactRequests,
  useCreateReport,
  useProfile,
} from '../../lib/hooks';
import type { ReportReason } from '../../lib/types';
import { Heart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  listingId: string;
  type: 'contact' | 'favorite' | 'report';
  listingUserId?: string;
}

const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'fraud', label: 'Fraude' },
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'duplicate', label: 'Anuncio duplicado' },
  { value: 'wrong_category', label: 'Categoría incorrecta' },
  { value: 'other', label: 'Otro' },
];

export default function ContactButton({ listingId, type, listingUserId }: Props) {
  const router = useRouter();
  const { data: profile } = useProfile();
  const isOwner = !!listingUserId && !!profile?.id && profile.id === listingUserId;

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportDetails, setReportDetails] = useState('');

  const requireAuth = () => {
    if (!getAccessToken()) {
      router.push(`/auth/login?redirect=/listings/${listingId}`);
      return false;
    }
    return true;
  };

  const addFavorite = useAddFavorite(listingId);
  const removeFavorite = useRemoveFavorite(listingId);
  const createContact = useCreateContactRequest(listingId);
  const createReport = useCreateReport(listingId);

  const { data: favData } = useMyFavorites();
  const isFavorited = favData?.data?.some((f) => f.listingId === listingId) ?? false;

  const { data: contactData } = useMyContactRequests();
  const alreadyRequested = contactData?.data?.some((cr) => cr.listingId === listingId) ?? false;

  if (type === 'favorite') {
    if (isOwner) return null;
    const saved = isFavorited || addFavorite.isSuccess;
    const pending = addFavorite.isPending || removeFavorite.isPending;

    return (
      <Button
        variant="outline"
        disabled={pending}
        className={cn('w-full', saved && 'border-[var(--accent-dim)] text-primary')}
        onClick={() => {
          if (!requireAuth()) return;
          if (saved) removeFavorite.mutate();
          else addFavorite.mutate();
        }}
      >
        <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
        {pending
          ? (saved ? 'Eliminando…' : 'Guardando…')
          : saved
          ? 'Guardado en favoritos'
          : 'Guardar en favoritos'}
      </Button>
    );
  }

  if (type === 'contact') {
    if (isOwner) return null;

    if (alreadyRequested || createContact.isSuccess) {
      return (
        <Button variant="outline" disabled className="w-full opacity-60">
          <CheckCircle size={15} className="text-[#6ECC96]" />
          ¡Mensaje enviado!
        </Button>
      );
    }

    if (!showForm) {
      return (
        <Button variant="outline" className="w-full" onClick={() => { if (requireAuth()) setShowForm(true); }}>
          Enviar mensaje
        </Button>
      );
    }

    return (
      <div className="flex flex-col gap-2.5">
        <Textarea
          placeholder="Mensaje al vendedor…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="text-[13px] resize-y"
        />
        {createContact.error && (
          <p className="text-[12px] text-destructive">{(createContact.error as Error).message}</p>
        )}
        <Button
          disabled={createContact.isPending}
          className="w-full"
          onClick={() => {
            if (!requireAuth()) return;
            createContact.mutate(message || undefined);
          }}
        >
          {createContact.isPending ? 'Enviando…' : 'Enviar mensaje'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-[12px]">
          Cancelar
        </Button>
      </div>
    );
  }

  if (type === 'report') {
    if (createReport.isSuccess) {
      return <p className="text-[13px] text-[#6ECC96] text-center py-2">Reporte enviado</p>;
    }

    if (!showForm) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-[11px] text-muted-foreground"
          onClick={() => { if (requireAuth()) setShowForm(true); }}
        >
          Reportar este anuncio
        </Button>
      );
    }

    return (
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
        <p className="text-[13px] font-medium">Reportar anuncio</p>

        <div className="flex flex-col gap-1.5">
          <Label className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">
            Motivo
          </Label>
          <Select value={reportReason} onValueChange={(v) => v && setReportReason(v as ReportReason)}>
            <SelectTrigger className="text-[13px] h-9">
              <SelectValue placeholder="Selecciona un motivo">
                {(v: string) => REASON_OPTIONS.find((o) => o.value === v)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {REASON_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value} label={label} className="text-[13px]">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Textarea
          placeholder="Detalles adicionales (opcional)…"
          value={reportDetails}
          onChange={(e) => setReportDetails(e.target.value)}
          rows={3}
          maxLength={1000}
          className="text-[13px] resize-y"
        />

        {createReport.error && (
          <p className="text-[12px] text-destructive">{(createReport.error as Error).message}</p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-[12px]"
            disabled={createReport.isPending}
            onClick={() => {
              if (!requireAuth()) return;
              createReport.mutate({ reason: reportReason, details: reportDetails || undefined });
            }}
          >
            {createReport.isPending ? 'Enviando…' : 'Enviar reporte'}
          </Button>
          <Button variant="ghost" size="sm" className="text-[12px]" onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
