"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Connexion() {
  const router = useRouter();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setMessage(null);
    setChargement(true);

    if (mode === "inscription") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: motDePasse,
      });
      if (error) {
        setErreur(error.message);
      } else if (data.session) {
        router.push("/");
      } else {
        setMessage("Compte créé. Vérifie ta boîte mail pour confirmer.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: motDePasse,
      });
      if (error) {
        setErreur(error.message);
      } else {
        router.push("/");
      }
    }

    setChargement(false);
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-3xl font-bold">
        {mode === "connexion" ? "Connexion" : "Créer un compte"}
      </h1>

      <form onSubmit={soumettre} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-gray-600 bg-transparent p-3"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Mot de passe (8 caractères minimum)"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="w-full rounded border border-gray-600 bg-transparent p-3"
        />

        {erreur && (
          <p className="rounded bg-red-100 p-3 text-sm text-red-700">{erreur}</p>
        )}
        {message && (
          <p className="rounded bg-green-100 p-3 text-sm text-green-700">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={chargement}
          className="w-full rounded bg-emerald-600 p-3 font-semibold text-white disabled:opacity-50"
        >
          {chargement
            ? "Patiente…"
            : mode === "connexion"
              ? "Se connecter"
              : "Créer mon compte"}
        </button>
      </form>

      <button
        onClick={() =>
          setMode(mode === "connexion" ? "inscription" : "connexion")
        }
        className="mt-4 text-sm text-gray-500 underline"
      >
        {mode === "connexion"
          ? "Pas de compte ? Inscris-toi"
          : "Déjà un compte ? Connecte-toi"}
      </button>
    </main>
  );
}