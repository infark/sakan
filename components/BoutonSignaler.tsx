"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const MOTIFS = [
  { value: "arnaque", label: "Arnaque suspectée" },
  { value: "deja_loue", label: "Déjà loué" },
  { value: "faux_prix", label: "Prix mensonger" },
  { value: "contenu_inapproprie", label: "Contenu inapproprié" },
  { value: "autre", label: "Autre" },
];

export default function BoutonSignaler({
  logementId,
}: {
  logementId: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("arnaque");
  const [details, setDetails] = useState("");
  const [etat, setEtat] = useState<"saisie" | "envoi" | "ok">("saisie");
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer() {
    setErreur(null);
    setEtat("envoi");

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setErreur("Connecte-toi pour signaler une annonce.");
      setEtat("saisie");
      return;
    }

    const { error } = await supabase.from("signalements").insert({
      logement_id: logementId,
      motif,
      details: details.trim() || null,
    });

    if (error) {
      setErreur(error.message);
      setEtat("saisie");
    } else {
      setEtat("ok");
    }
  }

  if (etat === "ok") {
    return (
      <p className="mt-6 text-sm text-gray-500">
        Merci, ton signalement a bien été envoyé.
      </p>
    );
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="mt-6 text-sm text-gray-500 underline"
      >
        Signaler cette annonce
      </button>
    );
  }

  return (
    <div className="mt-6 space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold">Signaler cette annonce</h3>

      <select
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        className="w-full rounded border border-gray-600 bg-transparent p-2"
      >
        {MOTIFS.map((m) => (
          <option key={m.value} value={m.value} className="text-black">
            {m.label}
          </option>
        ))}
      </select>

      <textarea
        maxLength={1000}
        rows={3}
        placeholder="Détails (optionnel)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        className="w-full rounded border border-gray-600 bg-transparent p-3"
      />

      {erreur && (
        <p className="rounded bg-red-100 p-3 text-sm text-red-700">{erreur}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={envoyer}
          disabled={etat === "envoi"}
          className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {etat === "envoi" ? "Envoi…" : "Envoyer le signalement"}
        </button>
        <button
          onClick={() => setOuvert(false)}
          className="text-sm text-gray-500 underline"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}