'use client';

import { useState } from 'react';
import { DetailsStep, type DetailsData } from './steps/DetailsStep';
import { PhotoStep, type PhotoEntry } from './steps/PhotoStep';
import { PublicationStep } from './steps/PublicationStep';

const STEPS = [
  { n: 1, label: 'Detalles' },
  { n: 2, label: 'Fotos' },
  { n: 3, label: 'Publicación' },
] as const;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                style={{
                  background: done ? '#6ECC96' : active ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: done || active ? '#000' : 'var(--text-muted)',
                  fontSize: done ? 16 : 13,
                  fontWeight: 700,
                  border: `2px solid ${done ? '#6ECC96' : active ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {done ? '✓' : s.n}
              </div>
              <span
                className="text-[11px] whitespace-nowrap"
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-16 h-0.5 mx-2 mb-[22px] shrink-0 transition-colors duration-300"
                style={{ background: done ? '#6ECC96' : 'var(--border)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function NewListingForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [details, setDetails] = useState<DetailsData | null>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  return (
    <div>
      <StepIndicator current={step} />

      {step === 1 && (
        <DetailsStep onNext={(data) => { setDetails(data); setStep(2); }} />
      )}
      {step === 2 && (
        <PhotoStep photos={photos} setPhotos={setPhotos} onNext={() => setStep(3)} />
      )}
      {step === 3 && details && (
        <PublicationStep details={details} photos={photos} />
      )}
    </div>
  );
}
