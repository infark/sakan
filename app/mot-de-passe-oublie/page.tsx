"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reinitialiser`,
    });

    if (error) {
      setErreur(error.message);
    } else {
      setEnvoye(true);
    }
    setChargement(false);
  }

  if (envoye) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="mb-4 text-3xl font-bold">Vérifie ta boîte mail</h1>
        <p className="mb-4 text-gray-500">
          Si un compte existe avec cette adresse, tu vas recevoir un lien pour
          choisir un nouveau mot de passe. Pense à regarder dans tes spams.
        </p>
        <Link href="/connexion" className="underline">
          Retour à la connexion
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-2 text-3xl font-bold">Mot de passe oublié</h1>
      <p className="mb-6 text-gray-500">
        Entre l&apos;email de ton compte, on t&apos;envoie un lien pour en
        choisir un nouveau.
      </p>

      <form onSubmit={envoyer} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          {chargement ? "Envoi…" : "Envoyer le lien"}
        </button>
      </form>

      <Link
        href="/connexion"
        className="mt-4 inline-block text-sm text-gray-500 underline"
      >
        Retour à la connexion
      </Link>
    </main>
  );
}