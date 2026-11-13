"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BoutonSignaler from "./BoutonSignaler";

export default function FormulaireAvis({
  logementId,
}: {
  logementId: number;
}) {
  const router = useRouter();
  const [connecte, setConnecte] = useState<boolean | null>(null);
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setConnecte(!!data.session);
    });
  }, []);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const { error } = await supabase.from("avis").insert({
      logement_id: logementId,
      note,
      commentaire: commentaire.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        setErreur("Tu as déjà donné ton avis sur ce logement.");
      } else if (error.code === "42501") {
        setErreur("Tu ne peux pas noter ton propre logement.");
      } else {
        setErreur(error.message);
      }
    } else {
      setCommentaire("");
      router.refresh();
    }
    setChargement(false);
  }

  if (connecte === null) return null;

  if (!connecte) {
    return (
      <>
        <p className="text-gray-500">
          <Link href="/connexion" className="underline">
            Connecte-toi
          </Link>{" "}
          pour donner ton avis.
        </p>
        <BoutonSignaler logementId={logementId} />
      </>
    );
  }

  return (
    <>
      <form onSubmit={envoyer} className="space-y-4 rounded-lg border p-4">
        <h3 className="font-semibold">Donner mon avis</h3>

        <div className="flex gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNote(n)}
              aria-label={`${n} sur 5`}
              className={n <= note ? "text-yellow-400" : "text-gray-600"}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          maxLength={1000}
          rows={3}
          placeholder="Ton expérience (propreté, propriétaire, bruit, transport…)"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          className="w-full rounded border border-gray-600 bg-transparent p-3"
        />

        {erreur && (
          <p className="rounded bg-red-100 p-3 text-sm text-red-700">
            {erreur}
          </p>
        )}

        <button
          type="submit"
          disabled={chargement}
          className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {chargement ? "Envoi…" : "Publier mon avis"}
        </button>
      </form>

      <BoutonSignaler logementId={logementId} />
    </>
  );
}