'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, X } from 'lucide-react';

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;
    background:var(--accent,#C87D38);
    border-radius:50%;
    border:3px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Colombia center
const DEFAULT_CENTER: [number, number] = [4.711, -74.0721];
const DEFAULT_ZOOM = 6;

// ── Sub-components (must live inside MapContainer) ────────────────────────────

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 1.2 });
  }, [center, map]);
  return null;
}

function ClickToPlace({ onPlace }: { onPlace: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onPlace(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

// ── Main component ─────────────────────────────────────────────────────────────

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  searchHint?: string;
  onChange: (lat: number, lng: number) => void;
  onClear: () => void;
  onLocationName?: (name: string) => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { 'User-Agent': 'PavasStore/1.0' } },
    );
    const data = await res.json();
    const addr = data?.address;
    if (addr) {
      return addr.city || addr.town || addr.village || addr.municipality || addr.county || data.display_name || null;
    }
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

export default function LocationPicker({
  latitude,
  longitude,
  searchHint = '',
  onChange,
  onClear,
  onLocationName,
}: LocationPickerProps) {
  const [query, setQuery] = useState(searchHint);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState('');
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const position: [number, number] | null =
    latitude != null && longitude != null ? [latitude, longitude] : null;

  const handleGeocode = async () => {
    if (!query.trim()) return;
    setGeocoding(true);
    setError('');
    try {
      const q = encodeURIComponent(query.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`,
        { headers: { 'User-Agent': 'PavasStore/1.0' } },
      );
      const data: { lat: string; lon: string }[] = await res.json();
      if (data.length === 0) { setError('No se encontró la ubicación'); return; }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      onChange(lat, lng);
      setFlyTarget([lat, lng]);
      if (onLocationName) onLocationName(query.trim());
    } catch {
      setError('Error al buscar la ubicación');
    } finally {
      setGeocoding(false);
    }
  };

  const handlePlace = async (lat: number, lng: number) => {
    onChange(lat, lng);
    if (onLocationName) {
      const name = await reverseGeocode(lat, lng);
      if (name) onLocationName(name);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Search row */}
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGeocode(); } }}
          placeholder="Buscar dirección, ciudad, barrio…"
          className="h-10 text-[13px] flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleGeocode}
          disabled={geocoding}
          className="h-10 shrink-0 px-4"
        >
          <Search size={14} />
          {geocoding ? ' …' : ' Buscar'}
        </Button>
        {position && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            className="h-10 shrink-0 px-3 text-muted-foreground"
          >
            <X size={13} />
          </Button>
        )}
      </div>

      {error && <p className="text-[12px] text-destructive">{error}</p>}

      <p className="text-[11px] text-muted-foreground">
        Busca o haz clic en el mapa para fijar la ubicación. Arrastra el punto para ajustar.
      </p>

      {/* Map */}
      <div
        style={{
          height: 280,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        <MapContainer
          center={position ?? DEFAULT_CENTER}
          zoom={position ? 14 : DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPlace={handlePlace} />
          <FlyTo center={flyTarget} />
          {position && (
            <Marker
              draggable
              position={position}
              icon={pinIcon}
              eventHandlers={{
                dragend(e) {
                  const m = e.target as L.Marker;
                  const p = m.getLatLng();
                  handlePlace(p.lat, p.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {position && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
          <MapPin size={11} />
          {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
        </p>
      )}
    </div>
  );
}
