'use client';

import dynamic from 'next/dynamic';

const ListingMap = dynamic(() => import('./ListingMap'), {
  ssr: false,
  loading: () => (
    <div style={{ height: 260, borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
  ),
});

export default function ListingMapClient({
  latitude,
  longitude,
  title,
}: {
  latitude: number;
  longitude: number;
  title?: string;
}) {
  return <ListingMap latitude={latitude} longitude={longitude} title={title} />;
}
