"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { urlPhoto } from "@/lib/photos";

type Annonce = {
  id: number;
  titre: string;
  description: string | null;
  type: string;
  prix_mensuel: number;
  charges_incluses: boolean;
  meuble: boolean;
  quartier: string;
  contact_tel: string | null;
  photos: string[];
  created_at: string;
};

export default function Admin() {
  const [etat, setEtat] = useState<"chargement" | "refuse" | "ok">(
    "chargement"
  );
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const { data, error } = await supabase
      .from("logements")
      .select(
        "id, titre, description, type, prix_mensuel, charges_incluses, meuble, quartier, contact_tel, photos, created_at"
      )
      .eq("statut", "en_attente")
      .order("created_at", { ascending: true });

    if (error) setErreur(error.message);
    else setAnnonces((data ?? []) as Annonce[]);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setEtat("refuse");
        return;
      }
      const { data: admin } = await supabase.rpc("est_admin");
      if (admin !== true) {
        setEtat("refuse");
        return;
      }
      setEtat("ok");
      await charger();
    }
    init();
  }, [charger]);

  async function decider(id: number, statut: "publie" | "archive") {
    setErreur(null);
    const { data, error } = await supabase
      .from("logements")
      .update({ statut })
      .eq("id", id)
      .select("id");

    if (error || !data || data.length === 0) {
      setErreur(error?.message ?? "Action refusée.");
      return;
    }
    setAnnonces((liste) => liste.filter((a) => a.id !== id));
  }

  if (etat === "chargement") {
    return <main className="mx-auto max-w-3xl p-6 text-gray-500">Chargement…</main>;
  }

  if (etat === "refuse") {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-4 text-3xl font-bold">Accès réservé</h1>
        <p className="mb-4 text-gray-500">
          Cette page est réservée à l&apos;administration.
        </p>
        <Link href="/" className="underline">
          Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-3xl font-bold">Modération</h1>
      <p className="mb-6 text-gray-500">
        {annonces.length} annonce{annonces.length > 1 ? "s" : ""} en attente
      </p>

      {erreur && (
        <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
          {erreur}
        </p>
      )}

      <ul className="space-y-6">
        {annonces.map((a) => (
          <li key={a.id} className="rounded-lg border p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold">{a.titre}</h2>
              <span className="whitespace-nowrap font-bold">
                {a.prix_mensuel} DT/mois
              </span>
            </div>

            <p className="text-sm text-gray-500">
              {a.quartier} · {a.type}
              {a.meuble ? " · meublé" : ""}
              {a.charges_incluses ? " · charges incluses" : ""}
              {a.contact_tel ? ` · tél : ${a.contact_tel}` : ""}
            </p>

            {a.description && (
              <p className="mt-3 whitespace-pre-line">{a.description}</p>
            )}

            {a.photos.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {a.photos.map((p) => (
                  <img
                    key={p}
                    src={urlPhoto(p)}
                    alt={a.titre}
                    className="h-32 w-auto rounded"
                  />
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => decider(a.id, "publie")}
                className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white"
              >
                Publier
              </button>
              <button
                onClick={() => decider(a.id, "archive")}
                className="rounded border border-red-500 px-4 py-2 font-semibold text-red-500"
              >
                Refuser
              </button>
            </div>
          </li>
        ))}
      </ul>

      {annonces.length === 0 && (
        <p className="text-gray-500">Rien à valider pour le moment.</p>
      )}
    </main>
  );
}