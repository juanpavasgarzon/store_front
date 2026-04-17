'use client';

import type { CategoryAttributeResponse } from '../../lib/types/categories';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function DynamicAttributeField({
  attribute,
  value,
  onChange,
}: {
  attribute: CategoryAttributeResponse;
  value: string;
  onChange: (value: string) => void;
}) {
  if (attribute.valueType === 'boolean') {
    return (
      <div className="flex gap-3">
        {(['true', 'false'] as const).map((option) => (
          <label
            key={option}
            className={cn(
              'flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-lg border transition-all duration-150',
              value === option
                ? 'border-[var(--accent-dim)] bg-[var(--bg-elevated)]'
                : 'border-[var(--border-light)] bg-transparent',
            )}
          >
            <input
              type="radio"
              name={attribute.key}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              className="w-[14px] h-[14px] accent-[var(--accent)]"
            />
            <span className="text-[13px] text-foreground">{option === 'true' ? 'Sí' : 'No'}</span>
          </label>
        ))}
      </div>
    );
  }

  if (attribute.valueType === 'select') {
    return (
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="text-[13px] h-10">
          <SelectValue placeholder="Selecciona una opción">
            {(v: string) => v || undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {attribute.options.map((option) => (
            <SelectItem key={option} value={option} className="text-[13px]">{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (attribute.valueType === 'number') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="text-[13px] h-10"
      />
    );
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={attribute.name}
      className="text-[13px] h-10"
    />
  );
}
