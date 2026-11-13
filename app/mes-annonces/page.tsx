"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Annonce = {
  id: number;
  titre: string;
  prix_mensuel: number;
  quartier: string;
  statut: "en_attente" | "publie" | "archive";
  created_at: string;
};

const LIBELLES = {
  en_attente: { texte: "En attente de validation", couleur: "text-orange-500" },
  publie: { texte: "Publiée", couleur: "text-emerald-500" },
  archive: { texte: "Retirée", couleur: "text-gray-500" },
};

export default function MesAnnonces() {
  const [connecte, setConnecte] = useState<boolean | null>(null);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("logements")
      .select("id, titre, prix_mensuel, quartier, statut, created_at")
      .eq("proprietaire_id", userId)
      .order("created_at", { ascending: false });

    if (error) setErreur(error.message);
    else setAnnonces((data ?? []) as Annonce[]);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setConnecte(!!user);
      if (user) charger(user.id);
    });
  }, [charger]);

  async function retirer(id: number) {
    setErreur(null);
    const { data, error } = await supabase
      .from("logements")
      .update({ statut: "archive" })
      .eq("id", id)
      .select("id");

    if (error || !data || data.length === 0) {
      setErreur(error?.message ?? "Action refusée.");
      return;
    }
    setAnnonces((liste) =>
      liste.map((a) => (a.id === id ? { ...a, statut: "archive" } : a))
    );
  }

  if (connecte === null) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-gray-500">Chargement…</main>
    );
  }

  if (!connecte) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="mb-4 text-3xl font-bold">Mes annonces</h1>
        <p className="mb-4 text-gray-500">Connecte-toi pour voir tes annonces.</p>
        <Link
          href="/connexion"
          className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white"
        >
          Se connecter
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Mes annonces</h1>

      {erreur && (
        <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
          {erreur}
        </p>
      )}

      <ul className="space-y-3">
        {annonces.map((a) => (
          <li key={a.id} className="rounded-lg border p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-semibold">
                {a.statut === "publie" ? (
                  <Link
                    href={`/logement/${a.id}`}
                    className="hover:underline"
                  >
                    {a.titre}
                  </Link>
                ) : (
                  a.titre
                )}
              </h2>
              <span className="whitespace-nowrap font-bold">
                {a.prix_mensuel} DT/mois
              </span>
            </div>
            <p className="text-sm text-gray-500">{a.quartier}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className={`text-sm font-medium ${LIBELLES[a.statut].couleur}`}>
                {LIBELLES[a.statut].texte}
              </span>
              {a.statut !== "archive" && (
                <button
                  onClick={() => retirer(a.id)}
                  className="text-sm text-red-500 underline"
                >
                  Retirer l&apos;annonce
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {annonces.length === 0 && (
        <p className="text-gray-500">
          Tu n&apos;as pas encore publié d&apos;annonce.{" "}
          <Link href="/publier" className="underline">
            Publier un logement
          </Link>
        </p>
      )}
    </main>
  );
}