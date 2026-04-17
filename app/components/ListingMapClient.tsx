'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:var(--accent,#C87D38);border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function CenterOn({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

function MapView({ latitude, longitude, title }: { latitude: number; longitude: number; title?: string }) {
  return (
    <div style={{ height: 260, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[latitude, longitude]} icon={pinIcon} title={title} />
        <CenterOn lat={latitude} lng={longitude} />
      </MapContainer>
    </div>
  );
}

const ListingMapDynamic = dynamic(() => Promise.resolve(MapView), { ssr: false });

export default function ListingMapClient({
  latitude,
  longitude,
  title,
}: {
  latitude: number;
  longitude: number;
  title?: string;
}) {
  return (
    <ListingMapDynamic latitude={latitude} longitude={longitude} title={title} />
  );
}
