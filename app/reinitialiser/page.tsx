"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Reinitialiser() {
  const [etat, setEtat] = useState<"verification" | "pret" | "invalide">(
    "verification"
  );
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [termine, setTermine] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEtat(data.session ? "pret" : "invalide");
    });
  }, []);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne sont pas identiques.");
      return;
    }

    setChargement(true);
    const { error } = await supabase.auth.updateUser({ password: motDePasse });

    if (error) {
      setErreur(error.message);
    } else {
      setTermine(true);
    }
    setChargement(false);
  }

  if (etat === "verification") {
    return (
      <main className="mx-auto max-w-md p-6 text-gray-500">Vérification…</main>
    );
  }

  if (etat === "invalide") {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="mb-4 text-3xl font-bold">Lien invalide ou expiré</h1>
        <p className="mb-4 text-gray-500">
          Ce lien ne fonctionne plus. Demande-en un nouveau.
        </p>
        <Link href="/mot-de-passe-oublie" className="underline">
          Demander un nouveau lien
        </Link>
      </main>
    );
  }

  if (termine) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="mb-4 text-3xl font-bold">Mot de passe modifié</h1>
        <p className="mb-4 text-gray-500">
          Ton nouveau mot de passe est enregistré, tu es connecté.
        </p>
        <a href="/" className="underline">
          Retour à l&apos;accueil
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-3xl font-bold">Nouveau mot de passe</h1>

      <form onSubmit={valider} className="space-y-4">
        <input
          type="password"
          required
          minLength={8}
          placeholder="Nouveau mot de passe (8 caractères minimum)"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="w-full rounded border border-gray-600 bg-transparent p-3"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Confirme le mot de passe"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="w-full rounded border border-gray-600 bg-transparent p-3"
        />

        {erreur && (
          <p className="rounded bg-red-100 p-3 text-sm text-red-700">{erreur}</p>
        )}

        <button
          type="submit"
          disabled={chargement}
          className="w-full rounded bg-emerald-600 p-3 font-semibold text-white disabled:opacity-50"
        >
          {chargement ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </main>
  );
}