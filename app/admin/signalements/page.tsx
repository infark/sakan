"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Signalement = {
  id: number;
  motif: string;
  details: string | null;
  created_at: string;
  logement_id: number;
  logements: { id: number; titre: string; statut: string } | null;
};

const MOTIFS: Record<string, string> = {
  arnaque: "Arnaque suspectée",
  deja_loue: "Déjà loué",
  faux_prix: "Prix mensonger",
  contenu_inapproprie: "Contenu inapproprié",
  autre: "Autre",
};

const STATUTS: Record<string, string> = {
  publie: "Publiée",
  en_attente: "En attente",
  archive: "Retirée",
};

export default function AdminSignalements() {
  const [etat, setEtat] = useState<"chargement" | "refuse" | "ok">(
    "chargement"
  );
  const [liste, setListe] = useState<Signalement[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const { data, error } = await supabase
      .from("signalements")
      .select(
        "id, motif, details, created_at, logement_id, logements(id, titre, statut)"
      )
      .eq("traite", false)
      .order("created_at", { ascending: true });

    if (error) setErreur(error.message);
    else setListe((data ?? []) as unknown as Signalement[]);
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

  async function ignorer(id: number) {
    setErreur(null);
    const { data, error } = await supabase
      .from("signalements")
      .update({ traite: true })
      .eq("id", id)
      .select("id");

    if (error || !data || data.length === 0) {
      setErreur(error?.message ?? "Action refusée.");
      return;
    }
    setListe((l) => l.filter((s) => s.id !== id));
  }

  async function retirer(s: Signalement) {
    setErreur(null);

    const { data: logement, error: e1 } = await supabase
      .from("logements")
      .update({ statut: "archive" })
      .eq("id", s.logement_id)
      .select("id");

    if (e1 || !logement || logement.length === 0) {
      setErreur(e1?.message ?? "Impossible de retirer l'annonce.");
      return;
    }

    const { error: e2 } = await supabase
      .from("signalements")
      .update({ traite: true })
      .eq("logement_id", s.logement_id);

    if (e2) {
      setErreur(e2.message);
      return;
    }
    setListe((l) => l.filter((x) => x.logement_id !== s.logement_id));
  }

  if (etat === "chargement") {
    return (
      <main className="mx-auto max-w-3xl p-6 text-gray-500">Chargement…</main>
    );
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
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-bold">Signalements</h1>
        <Link href="/admin" className="text-sm underline">
          ← Modération
        </Link>
      </div>
      <p className="mb-6 text-gray-500">
        {liste.length} signalement{liste.length > 1 ? "s" : ""} à traiter
      </p>

      {erreur && (
        <p className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
          {erreur}
        </p>
      )}

      <ul className="space-y-4">
        {liste.map((s) => (
          <li key={s.id} className="rounded-lg border p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-semibold">
                {s.logements ? (
                  <Link
                    href={`/logement/${s.logements.id}`}
                    className="hover:underline"
                  >
                    {s.logements.titre}
                  </Link>
                ) : (
                  "Annonce introuvable"
                )}
              </h2>
              <span className="whitespace-nowrap text-sm text-gray-500">
                {s.logements ? STATUTS[s.logements.statut] ?? "" : ""}
              </span>
            </div>

            <p className="mt-2 font-medium text-orange-500">
              {MOTIFS[s.motif] ?? s.motif}
            </p>
            {s.details && (
              <p className="mt-1 whitespace-pre-line text-sm">{s.details}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Signalé le {new Date(s.created_at).toLocaleDateString("fr-FR")}
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => retirer(s)}
                className="rounded border border-red-500 px-4 py-2 text-sm font-semibold text-red-500"
              >
                Retirer l&apos;annonce
              </button>
              <button
                onClick={() => ignorer(s.id)}
                className="rounded border border-gray-600 px-4 py-2 text-sm font-semibold"
              >
                Ignorer
              </button>
            </div>
          </li>
        ))}
      </ul>

      {liste.length === 0 && (
        <p className="text-gray-500">Aucun signalement à traiter.</p>
      )}
    </main>
  );
}