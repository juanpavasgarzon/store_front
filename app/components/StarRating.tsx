import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  showCount?: boolean;
  count?: number;
}

export default function StarRating({
  value,
  max = 5,
  size = 14,
  showCount = false,
  count,
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {stars.map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= Math.round(value) ? 'var(--accent)' : 'var(--border-light)'}
          stroke={star <= Math.round(value) ? 'var(--accent)' : 'var(--border-light)'}
        />
      ))}
      {showCount && count !== undefined && (
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
          ({count})
        </span>
      )}
    </span>
  );
}
