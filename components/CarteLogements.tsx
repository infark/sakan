"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

export type LogementCarte = {
  id: number;
  titre: string;
  type: string;
  prix_mensuel: number;
  quartier: string;
  latitude: number;
  longitude: number;
};

function iconePrix(prix: number) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div style="transform:translate(-50%,-50%);width:max-content;background:#059669;color:#fff;font-weight:700;font-size:12px;padding:4px 8px;border-radius:999px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${prix} DT</div>`,
  });
}

function AjusterVue({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 15 });
  }, [map, points]);
  return null;
}

export default function CarteLogements({
  logements,
}: {
  logements: LogementCarte[];
}) {
  const points = useMemo(
    () =>
      logements.map((l) => [l.latitude, l.longitude] as [number, number]),
    [logements]
  );

  return (
    <MapContainer
      center={[36.8065, 10.1815]}
      zoom={12}
      scrollWheelZoom={false}
      className="z-0 h-96 w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjusterVue points={points} />
      {logements.map((l) => (
        <Marker
          key={l.id}
          position={[l.latitude, l.longitude]}
          icon={iconePrix(l.prix_mensuel)}
        >
          <Popup>
            <strong>{l.titre}</strong>
            <br />
            {l.quartier} · {l.type}
            <br />
            {l.prix_mensuel} DT/mois
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}