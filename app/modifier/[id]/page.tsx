"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { QUARTIERS, TYPES } from "@/lib/quartiers";

export default function Modifier() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [etat, setEtat] = useState<
    "chargement" | "deconnecte" | "introuvable" | "ok"
  >("chargement");
  const [statutInitial, setStatutInitial] = useState("");
  const [quartierInitial, setQuartierInitial] = useState("");

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("chambre");
  const [prix, setPrix] = useState("");
  const [quartier, setQuartier] = useState("Centre-ville");
  const [meuble, setMeuble] = useState(false);
  const [charges, setCharges] = useState(false);
  const [tel, setTel] = useState("");

  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    async function charger() {
      const { data: session } = await supabase.auth.getSession();
      const user = session.session?.user;
      if (!user) {
        setEtat("deconnecte");
        return;
      }

      const { data } = await supabase
        .from("logements")
        .select(
          "titre, description, type, prix_mensuel, charges_incluses, meuble, quartier, contact_tel, statut"
        )
        .eq("id", id)
        .eq("proprietaire_id", user.id)
        .maybeSingle();

      if (!data || data.statut === "archive") {
        setEtat("introuvable");
        return;
      }

      setStatutInitial(data.statut);
      setQuartierInitial(data.quartier);
      setTitre(data.titre);
      setDescription(data.description ?? "");
      setType(data.type);
      setPrix(String(data.prix_mensuel));
      setQuartier(data.quartier in QUARTIERS ? data.quartier : "Centre-ville");
      setMeuble(data.meuble);
      setCharges(data.charges_incluses);
      setTel(data.contact_tel ?? "");
      setEtat("ok");
    }
    charger();
  }, [id]);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const modifs: Record<string, unknown> = {
      titre: titre.trim(),
      description: description.trim() || null,
      type,
      prix_mensuel: Number(prix),
      charges_incluses: charges,
      meuble,
      quartier,
      contact_tel: tel.trim() || null,
      statut: "en_attente",
    };

    if (quartier !== quartierInitial) {
      const [lat, lng] = QUARTIERS[quartier];
      const decalage = () => (Math.random() - 0.5) * 0.004;
      modifs.latitude = lat + decalage();
      modifs.longitude = lng + decalage();
    }

    const { data, error } = await supabase
      .from("logements")
      .update(modifs)
      .eq("id", id)
      .select("id");

    if (error || !data || data.length === 0) {
      setErreur(error?.message ?? "Modification refusée.");
    } else {
      setEnregistre(true);
    }
    setChargement(false);
  }

  if (etat === "chargement") {
    return (
      <main className="mx-auto max-w-xl p-6 text-gray-500">Chargement…</main>
    );
  }

  if (etat === "deconnecte") {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="mb-4 text-3xl font-bold">Modifier mon annonce</h1>
        <p className="mb-4 text-gray-500">
          Connecte-toi pour modifier ton annonce.
        </p>
        <Link
          href="/connexion"
          className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white"
        >
          Se connecter
        </Link>
      </main>
    );
  }

  if (etat === "introuvable") {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="mb-4 text-3xl font-bold">Annonce introuvable</h1>
        <p className="mb-4 text-gray-500">
          Cette annonce n&apos;existe pas, ne t&apos;appartient pas ou a déjà
          été retirée.
        </p>
        <Link href="/mes-annonces" className="underline">
          Retour à mes annonces
        </Link>
      </main>
    );
  }

  if (enregistre) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="mb-4 text-3xl font-bold">Modifications enregistrées</h1>
        <p className="mb-4 text-gray-500">
          Ton annonce sera de nouveau visible après vérification.
        </p>
        <Link href="/mes-annonces" className="underline">
          Retour à mes annonces
        </Link>
      </main>
    );
  }

  const champ = "w-full rounded border border-gray-600 bg-transparent p-3";

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-3xl font-bold">Modifier mon annonce</h1>

      {statutInitial === "publie" && (
        <p className="mb-4 rounded border border-orange-500 p-3 text-sm text-orange-500">
          Cette annonce est publiée. Si tu la modifies, elle sera invisible
          jusqu&apos;à sa nouvelle vérification.
        </p>
      )}

      <form onSubmit={enregistrer} className="space-y-4">
        <input
          required
          minLength={5}
          maxLength={120}
          placeholder="Titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className={champ}
        />

        <textarea
          maxLength={2000}
          rows={4}
          placeholder="Description (optionnel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={champ}
        />

        <div className="grid grid-cols-2 gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={champ}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value} className="text-black">
                {t.label}
              </option>
            ))}
          </select>

          <input
            required
            type="number"
            min={1}
            placeholder="Prix (DT/mois)"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            className={champ}
          />
        </div>

        <select
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
          className={champ}
        >
          {Object.keys(QUARTIERS).map((q) => (
            <option key={q} value={q} className="text-black">
              {q}
            </option>
          ))}
        </select>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={meuble}
              onChange={(e) => setMeuble(e.target.checked)}
            />
            Meublé
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={charges}
              onChange={(e) => setCharges(e.target.checked)}
            />
            Charges incluses
          </label>
        </div>

        <input
          type="tel"
          placeholder="Téléphone de contact (optionnel)"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          className={champ}
        />

        <p className="text-xs text-gray-500">
          Les photos ne sont pas modifiables pour l&apos;instant.
        </p>

        {erreur && (
          <p className="rounded bg-red-100 p-3 text-sm text-red-700">{erreur}</p>
        )}

        <button
          type="submit"
          disabled={chargement}
          className="w-full rounded bg-emerald-600 p-3 font-semibold text-white disabled:opacity-50"
        >
          {chargement ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>

        <Link
          href="/mes-annonces"
          className="block text-center text-sm text-gray-500 underline"
        >
          Annuler
        </Link>
      </form>
    </main>
  );
}