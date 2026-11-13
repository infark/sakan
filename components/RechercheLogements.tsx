"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CarteWrapper from "./CarteWrapper";
import { urlPhoto } from "@/lib/photos";
import { FACULTES } from "@/lib/facultes";
import { distanceKm } from "@/lib/distance";

export type Logement = {
  id: number;
  titre: string;
  type: string;
  prix_mensuel: number;
  charges_incluses: boolean;
  meuble: boolean;
  quartier: string;
  latitude: number | null;
  longitude: number | null;
  photos: string[] | null;
};

type LogementAvecDistance = Logement & { distance: number | null };

const TYPES = [
  { value: "tous", label: "Tous les types" },
  { value: "chambre", label: "Chambre" },
  { value: "studio", label: "Studio" },
  { value: "s1", label: "S+1" },
  { value: "s2", label: "S+2" },
  { value: "s3", label: "S+3" },
  { value: "colocation", label: "Colocation" },
];

export default function RechercheLogements({
  logements,
}: {
  logements: Logement[];
}) {
  const [budgetMax, setBudgetMax] = useState(2000);
  const [type, setType] = useState("tous");
  const [meubleSeulement, setMeubleSeulement] = useState(false);
  const [chargesSeulement, setChargesSeulement] = useState(false);
  const [faculteId, setFaculteId] = useState("aucune");
  const [distanceMax, setDistanceMax] = useState(10);

  const faculte = FACULTES.find((f) => f.id === faculteId) ?? null;

  const filtres = useMemo(() => {
    const liste: LogementAvecDistance[] = logements.map((l) => ({
      ...l,
      distance:
        faculte && l.latitude !== null && l.longitude !== null
          ? distanceKm(
              faculte.latitude,
              faculte.longitude,
              l.latitude,
              l.longitude
            )
          : null,
    }));

    const resultat = liste.filter(
      (l) =>
        l.prix_mensuel <= budgetMax &&
        (type === "tous" || l.type === type) &&
        (!meubleSeulement || l.meuble) &&
        (!chargesSeulement || l.charges_incluses) &&
        (!faculte || (l.distance !== null && l.distance <= distanceMax))
    );

    if (faculte) {
      resultat.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
    return resultat;
  }, [
    logements,
    budgetMax,
    type,
    meubleSeulement,
    chargesSeulement,
    faculte,
    distanceMax,
  ]);

  const pointsCarte = useMemo(
    () =>
      filtres.flatMap((l) =>
        l.latitude !== null && l.longitude !== null
          ? [
              {
                id: l.id,
                titre: l.titre,
                type: l.type,
                prix_mensuel: l.prix_mensuel,
                quartier: l.quartier,
                latitude: l.latitude,
                longitude: l.longitude,
              },
            ]
          : []
      ),
    [filtres]
  );

  function reinitialiser() {
    setBudgetMax(2000);
    setType("tous");
    setMeubleSeulement(false);
    setChargesSeulement(false);
    setFaculteId("aucune");
    setDistanceMax(10);
  }

  return (
    <>
      <div className="mb-4 space-y-4 rounded-lg border p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Budget max : {budgetMax} DT/mois
          </label>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={budgetMax}
            onChange={(e) => setBudgetMax(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Ma faculté</label>
          <select
            value={faculteId}
            onChange={(e) => setFaculteId(e.target.value)}
            className="w-full rounded border border-gray-600 bg-transparent p-2"
          >
            <option value="aucune" className="text-black">
              Pas de faculté choisie
            </option>
            {FACULTES.map((f) => (
              <option key={f.id} value={f.id} className="text-black">
                {f.nom}
              </option>
            ))}
          </select>
        </div>

        {faculte && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Distance max : {distanceMax} km
            </label>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={distanceMax}
              onChange={(e) => setDistanceMax(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded border border-gray-600 bg-transparent p-2"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value} className="text-black">
                {t.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={meubleSeulement}
              onChange={(e) => setMeubleSeulement(e.target.checked)}
            />
            Meublé
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={chargesSeulement}
              onChange={(e) => setChargesSeulement(e.target.checked)}
            />
            Charges incluses
          </label>

          <button
            onClick={reinitialiser}
            className="ml-auto text-sm text-gray-500 underline"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="mb-6">
        <CarteWrapper logements={pointsCarte} />
      </div>

      <p className="mb-3 text-sm text-gray-500">
        {filtres.length} logement{filtres.length > 1 ? "s" : ""}
        {faculte ? " · triés du plus proche au plus loin" : ""}
      </p>

      <ul className="space-y-3">
        {filtres.map((l) => (
          <li key={l.id} className="flex gap-4 rounded-lg border p-4">
            {l.photos && l.photos.length > 0 ? (
              <img
                src={urlPhoto(l.photos[0])}
                alt={l.titre}
                className="h-24 w-32 flex-shrink-0 rounded object-cover"
              />
            ) : (
              <div className="flex h-24 w-32 flex-shrink-0 items-center justify-center rounded bg-gray-800 text-xs text-gray-500">
                Pas de photo
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-semibold">
                  <Link
                    href={`/logement/${l.id}`}
                    className="hover:underline"
                  >
                    {l.titre}
                  </Link>
                </h2>
                <span className="whitespace-nowrap font-bold">
                  {l.prix_mensuel} DT/mois
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {l.quartier} · {l.type}
                {l.meuble ? " · meublé" : ""}
                {l.charges_incluses ? " · charges incluses" : ""}
              </p>
              {faculte && l.distance !== null && (
                <p className="mt-1 text-sm text-emerald-500">
                  ~{l.distance.toFixed(1).replace(".", ",")} km de{" "}
                  {faculte.nom}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {filtres.length === 0 && (
        <p className="text-gray-500">
          Aucun logement ne correspond à ces filtres.
        </p>
      )}
    </>
  );
}